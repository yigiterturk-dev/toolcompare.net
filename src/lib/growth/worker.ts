import OpenAI from "openai";
import { claimNextJob, completeJob, failJob, saveReview, type GrowthJob } from "./store";
import { scoreToolDraft, slugifyTool, type ToolDraft } from "./quality";
import { verifySources } from "./source-verification";

type JobPayload = {
  category?: string;
  count?: number;
  seedDraft?: Partial<ToolDraft>;
};

function parsePayload(job: GrowthJob): JobPayload {
  if (typeof job.payload === "string") {
    try { return JSON.parse(job.payload) as JobPayload; } catch { return {}; }
  }
  return job.payload as JobPayload;
}

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function generateDrafts(payload: JobPayload) {
  const category = payload.category?.trim() || payload.seedDraft?.category || "Productivity";
  const count = Math.min(Math.max(payload.count ?? 1, 1), 5);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const seed = payload.seedDraft ? JSON.stringify(payload.seedDraft) : "none";
  const prompt = `Create ${count} evidence-aware software directory draft(s) for category "${category}".
This is a REVIEW QUEUE, not automatic publishing. Never invent a logo, customer count, award, integration,
price, security certification, or performance claim. If a fact is uncertain, state the limitation.
Each draft needs at least two HTTPS sources; one should be the official product website or pricing page.
Seed draft, if any: ${seed}

Return JSON only:
{"tools":[{"name":"","category":"","websiteUrl":"https://","shortDescription":"","longDescription":"",
"targetAudience":"","verdict":"","pros":["","",""],"cons":["",""],"keyFeatures":[
{"title":"","description":""},{"title":"","description":""},{"title":"","description":""}],
"basePrice":0,"isFlat":false,"ease":0,"featuresScore":0,"iconName":"Zap",
"color1":"#50545f","color2":"#25272d","sources":[
{"url":"https://","title":"","type":"official"},{"url":"https://","title":"","type":"pricing"}]}]}`;

  const completion = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a cautious software research editor. Accuracy beats volume." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned no content.");
  const parsed = JSON.parse(content) as { tools?: Array<Omit<ToolDraft, "slug">> };
  return (parsed.tools ?? []).map((tool) => ({
    ...tool,
    slug: slugifyTool(tool.name ?? ""),
    basePrice: Number(tool.basePrice) || 0,
    ease: Number(tool.ease) || 0,
    featuresScore: Number(tool.featuresScore) || 0,
  })) as ToolDraft[];
}

async function processJob(job: GrowthJob) {
  if (job.type !== "tool_generation") throw new Error(`Unsupported job type: ${job.type}`);
  const drafts = await generateDrafts(parsePayload(job));
  if (drafts.length === 0) throw new Error("No usable drafts were generated.");
  const results = [];
  for (const draft of drafts) {
    draft.sources = await verifySources(draft.sources);
    const quality = scoreToolDraft(draft);
    await saveReview(draft, quality.score, quality.reasons);
    results.push({ slug: draft.slug, score: quality.score, publishable: quality.publishable });
  }
  const average = Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length);
  await completeJob(job.id, { drafts: results }, average);
  return results.length;
}

export async function runGrowthWorker(limit = 3) {
  const summary = { processed: 0, succeeded: 0, failed: 0 };
  for (let index = 0; index < Math.min(Math.max(limit, 1), 10); index += 1) {
    const job = await claimNextJob();
    if (!job) break;
    summary.processed += 1;
    try {
      await processJob(job);
      summary.succeeded += 1;
    } catch (error) {
      summary.failed += 1;
      await failJob(job, error instanceof Error ? error.message : "Unknown worker error");
    }
  }
  return summary;
}
