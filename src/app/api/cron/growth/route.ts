import { NextResponse } from "next/server";
import { runGrowthWorker } from "@/lib/growth/worker";
import { growthStorageAvailable } from "@/lib/growth/store";

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  if (!expected || provided !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!growthStorageAvailable()) {
    return NextResponse.json({ error: "Persistent database is not configured." }, { status: 503 });
  }
  return NextResponse.json({ success: true, ...(await runGrowthWorker(3)) });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
