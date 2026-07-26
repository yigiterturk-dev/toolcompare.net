import { NextResponse } from "next/server";
import { checkAdminPassword } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { enqueueGrowthJob, growthStorageAvailable } from "@/lib/growth/store";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`tools-generate:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const body = await request.json() as { category?: string; count?: number; password?: string };
    if (!checkAdminPassword(body.password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!growthStorageAvailable()) {
      return NextResponse.json(
        { error: "Persistent database is required for the review queue." },
        { status: 503 }
      );
    }
    const category = body.category?.trim();
    if (!category || category.length > 100) {
      return NextResponse.json({ error: "A valid category is required." }, { status: 400 });
    }
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 5);
    const jobId = await enqueueGrowthJob("tool_generation", { category, count }, 60);
    return NextResponse.json({
      success: Boolean(jobId),
      queued: true,
      jobId,
      message: "Draft generation queued. Nothing will publish without review.",
    });
  } catch {
    return NextResponse.json({ error: "Could not queue generation." }, { status: 500 });
  }
}
