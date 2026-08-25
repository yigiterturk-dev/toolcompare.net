import { NextResponse } from "next/server";
import { yoneticiMi } from "@/lib/adminAuth";
import {
  enqueueGrowthJob,
  growthSnapshot,
  growthStorageAvailable,
  reviewAction,
} from "@/lib/growth/store";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function authorized(request: Request) {
  return yoneticiMi(request.headers.get("x-admin-password"));
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await growthSnapshot());
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`growth-admin:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!growthStorageAvailable()) {
    return NextResponse.json({ error: "Persistent database is not configured." }, { status: 503 });
  }
  const body = await request.json() as {
    action?: string;
    category?: string;
    count?: number;
    reviewId?: number;
  };
  if (body.action === "queue") {
    const category = body.category?.trim();
    if (!category || category.length > 100) {
      return NextResponse.json({ error: "A valid category is required." }, { status: 400 });
    }
    const id = await enqueueGrowthJob(
      "tool_generation",
      { category, count: Math.min(Math.max(body.count ?? 1, 1), 5) },
      60
    );
    return NextResponse.json({ success: Boolean(id), jobId: id });
  }
  if (
    ["approve", "reject", "retry"].includes(body.action ?? "") &&
    Number.isInteger(body.reviewId)
  ) {
    const success = await reviewAction(
      body.reviewId as number,
      body.action as "approve" | "reject" | "retry"
    );
    return NextResponse.json({ success }, { status: success ? 200 : 409 });
  }
  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
