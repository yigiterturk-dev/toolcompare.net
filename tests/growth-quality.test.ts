import test from "node:test";
import assert from "node:assert/strict";
import { scoreToolDraft, slugifyTool, type ToolDraft } from "../src/lib/growth/quality.ts";
import { isBlockedSourceUrl } from "../src/lib/growth/source-verification.ts";

const completeDraft: ToolDraft = {
  slug: "verified-tool",
  name: "Verified Tool",
  category: "Analytics",
  websiteUrl: "https://verified.example",
  shortDescription: "A focused analytics workspace for product teams that need reliable reporting.",
  longDescription: "Evidence-led review. ".repeat(35),
  targetAudience: "Product and analytics teams that need governed reporting workflows.",
  verdict: "A credible option when traceable sources and workflow control matter more than novelty.",
  pros: ["Clear workflow", "Strong exports", "Useful reporting"],
  cons: ["Limited free tier", "Setup takes time"],
  keyFeatures: [
    { title: "Reports", description: "Build governed reports from connected product data sources." },
    { title: "Exports", description: "Export reviewed datasets for downstream finance and operations." },
    { title: "Controls", description: "Apply access rules and review checkpoints to shared analysis." },
  ],
  basePrice: 20,
  isFlat: false,
  ease: 82,
  featuresScore: 86,
  sources: [
    { url: "https://verified.example", type: "official" },
    { url: "https://verified.example/pricing", type: "pricing" },
  ],
};

test("slugifyTool produces stable URL slugs", () => {
  assert.equal(slugifyTool("  Verified Tool™  "), "verified-tool");
});

test("complete sourced draft clears the publish threshold", () => {
  const result = scoreToolDraft(completeDraft);
  assert.equal(result.publishable, true);
  assert.ok(result.score >= 80);
  assert.equal(result.contentHash.length, 64);
});

test("unsourced shallow draft cannot publish", () => {
  const result = scoreToolDraft({ ...completeDraft, longDescription: "Too short.", sources: [] });
  assert.equal(result.publishable, false);
  assert.ok(result.reasons.some((reason) => reason.includes("sources")));
});

test("source verifier rejects local and credentialed URLs", () => {
  assert.equal(isBlockedSourceUrl("https://127.0.0.1/admin"), true);
  assert.equal(isBlockedSourceUrl("https://user:pass@example.com"), true);
  assert.equal(isBlockedSourceUrl("http://example.com"), true);
  assert.equal(isBlockedSourceUrl("https://example.com/pricing"), false);
});
