import toolsJson from "@/data/tools.json";
import { ensureTables, query } from "@/lib/db";

export type ToolRecord = {
  slug: string;
  name: string;
  category: string;
  iconName?: string;
  color1?: string;
  color2?: string;
  ease: number;
  featuresScore: number;
  basePrice: number;
  isFlat: boolean;
  websiteUrl?: string;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  targetAudience?: string | { description?: string; text?: string };
  target_audience?: { description?: string; text?: string; small_businesses?: string };
  verdict?: string | { text?: string };
  expertVerdict?: { conclusion?: string; summary?: string; text?: string };
  expert_verdict?: string | { conclusion?: string; summary?: string };
  pros?: string[];
  cons?: string[];
  keyFeatures?: Array<{ title: string; description: string }>;
  key_features?: Array<{ title: string; description: string }>;
  features?: string[] | Array<{ title: string; description: string }>;
  review?: { text?: string; body?: string; introduction?: string };
};

function parseTool(row: Record<string, unknown>): ToolRecord {
  const jsonFields = ["pros", "cons", "keyFeatures"] as const;
  const parsed = { ...row };
  for (const field of jsonFields) {
    if (typeof parsed[field] === "string") {
      try { parsed[field] = JSON.parse(parsed[field] as string); } catch { parsed[field] = []; }
    }
  }
  return parsed as unknown as ToolRecord;
}

export async function getAllTools(): Promise<ToolRecord[]> {
  if (await ensureTables()) {
    const rows = await query("SELECT * FROM tools ORDER BY name ASC") as Array<Record<string, unknown>> | null;
    if (rows?.length) return rows.map(parseTool);
  }
  return toolsJson as unknown as ToolRecord[];
}

export async function getToolBySlug(slug: string) {
  if (await ensureTables()) {
    const rows = await query("SELECT * FROM tools WHERE slug = ? LIMIT 1", [slug]) as Array<Record<string, unknown>> | null;
    if (rows?.[0]) return parseTool(rows[0]);
  }
  return (toolsJson as unknown as ToolRecord[]).find((tool) => tool.slug === slug) ?? null;
}
