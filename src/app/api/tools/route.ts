import { NextResponse } from "next/server";
import { getTools } from "@/lib/tools";

// Yukleme mantigi src/lib/tools.ts'e tasindi; sunucu bileseni de ayni
// kaynagi kullaniyor, iki yerde kopya mantik kalmasin diye.
export async function GET() {
  const tools = await getTools();
  if (tools.length === 0) {
    return NextResponse.json({ error: "Failed to read tools data" }, { status: 500 });
  }
  return NextResponse.json(tools);
}
