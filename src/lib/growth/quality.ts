import crypto from "crypto";

export type ToolDraft = {
  slug: string;
  name: string;
  category: string;
  websiteUrl: string;
  shortDescription: string;
  longDescription: string;
  targetAudience: string;
  verdict: string;
  pros: string[];
  cons: string[];
  keyFeatures: Array<{ title: string; description: string }>;
  basePrice: number;
  isFlat: boolean;
  ease: number;
  featuresScore: number;
  iconName?: string;
  color1?: string;
  color2?: string;
  sources?: Array<{ url: string; title?: string; type?: string }>;
};

export type QualityResult = {
  score: number;
  publishable: boolean;
  reasons: string[];
  contentHash: string;
};

const GENERIC_PHRASES = [
  "unlock the power",
  "revolutionary solution",
  "game-changing",
  "seamlessly empowers",
  "all-in-one solution",
];

export function slugifyTool(value: string) {
  return value
    .replace(/[™®©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function scoreToolDraft(draft: ToolDraft): QualityResult {
  let score = 0;
  const reasons: string[] = [];
  const sources = draft.sources?.filter((source) => {
    try {
      const url = new URL(source.url);
      return url.protocol === "https:";
    } catch {
      return false;
    }
  }) ?? [];

  if (draft.name.trim().length >= 2 && draft.slug === slugifyTool(draft.name)) score += 10;
  else reasons.push("Name or slug needs correction.");

  if (draft.category.trim().length >= 2) score += 5;
  else reasons.push("Category is missing.");

  if (draft.shortDescription.length >= 50 && draft.shortDescription.length <= 180) score += 10;
  else reasons.push("Short description must be 50–180 characters.");

  if (draft.longDescription.length >= 500) score += 15;
  else reasons.push("Review is too shallow.");

  if (draft.pros.length >= 3 && draft.cons.length >= 2) score += 10;
  else reasons.push("Balanced pros and cons are required.");

  if (
    draft.keyFeatures.length >= 3 &&
    draft.keyFeatures.every((feature) => feature.title.length >= 3 && feature.description.length >= 30)
  ) score += 10;
  else reasons.push("At least three explained features are required.");

  if (draft.targetAudience.length >= 40 && draft.verdict.length >= 60) score += 10;
  else reasons.push("Audience or verdict lacks detail.");

  if (draft.ease >= 0 && draft.ease <= 100 && draft.featuresScore >= 0 && draft.featuresScore <= 100) score += 5;
  else reasons.push("Scores must stay within 0–100.");

  if (draft.websiteUrl.startsWith("https://")) score += 5;
  else reasons.push("An HTTPS official website is required.");

  if (sources.length >= 2) score += 15;
  else reasons.push("At least two HTTPS sources are required.");

  const body = `${draft.shortDescription} ${draft.longDescription} ${draft.verdict}`.toLowerCase();
  if (!GENERIC_PHRASES.some((phrase) => body.includes(phrase))) score += 5;
  else reasons.push("Generic AI phrasing detected.");

  const normalized = JSON.stringify({
    name: draft.name,
    category: draft.category,
    websiteUrl: draft.websiteUrl,
    shortDescription: draft.shortDescription,
    longDescription: draft.longDescription,
    pros: draft.pros,
    cons: draft.cons,
    keyFeatures: draft.keyFeatures,
  });

  return {
    score,
    publishable: score >= 80 && sources.length >= 2,
    reasons,
    contentHash: crypto.createHash("sha256").update(normalized).digest("hex"),
  };
}
