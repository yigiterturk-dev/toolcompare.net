import { ensureGrowthTables, isDatabaseConfigured, queryStrict as query } from "@/lib/db";
import type { ToolDraft } from "./quality";

export type GrowthJob = {
  id: number;
  type: string;
  status: string;
  payload: string | Record<string, unknown>;
  attempts: number;
  max_attempts: number;
};

export function growthStorageAvailable() {
  return isDatabaseConfigured();
}

export async function enqueueGrowthJob(
  type: string,
  payload: Record<string, unknown>,
  priority = 50
) {
  if (!(await ensureGrowthTables())) return null;
  const result = await query(
    `INSERT INTO automation_jobs (type, payload, priority) VALUES (?, ?, ?)`,
    [type, JSON.stringify(payload), priority]
  ) as { insertId?: number } | null;
  return result?.insertId ?? null;
}

export async function claimNextJob() {
  if (!(await ensureGrowthTables())) return null;
  const rows = await query(
    `SELECT * FROM automation_jobs
     WHERE status = 'queued' AND scheduled_at <= CURRENT_TIMESTAMP
     ORDER BY priority DESC, id ASC LIMIT 1`
  ) as GrowthJob[] | null;
  const job = rows?.[0];
  if (!job) return null;
  const result = await query(
    `UPDATE automation_jobs
     SET status = 'running', attempts = attempts + 1, started_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status = 'queued'`,
    [job.id]
  ) as { affectedRows?: number } | null;
  return result?.affectedRows === 1 ? job : null;
}

export async function completeJob(id: number, result: unknown, qualityScore?: number) {
  await query(
    `UPDATE automation_jobs
     SET status = 'completed', result = ?, quality_score = ?, finished_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [JSON.stringify(result), qualityScore ?? null, id]
  );
}

export async function failJob(job: GrowthJob, message: string) {
  const nextStatus = job.attempts + 1 >= job.max_attempts ? "failed" : "queued";
  await query(
    `UPDATE automation_jobs SET status = ?, error_message = ?,
     scheduled_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE),
     finished_at = IF(? = 'failed', CURRENT_TIMESTAMP, NULL)
     WHERE id = ?`,
    [nextStatus, message.slice(0, 2000), nextStatus, job.id]
  );
}

export async function saveReview(draft: ToolDraft, score: number, reasons: string[]) {
  await query(
    `INSERT INTO content_reviews
      (content_type, content_key, status, quality_score, reasons, payload, source_count)
     VALUES ('tool', ?, 'pending', ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE quality_score = VALUES(quality_score),
       reasons = VALUES(reasons), payload = VALUES(payload),
       source_count = VALUES(source_count), status = 'pending'`,
    [
      draft.slug,
      score,
      JSON.stringify(reasons),
      JSON.stringify(draft),
      draft.sources?.length ?? 0,
    ]
  );
}

export async function growthSnapshot() {
  if (!(await ensureGrowthTables())) return { available: false };
  const [jobs, reviews, tools] = await Promise.all([
    query(`SELECT id, type, status, priority, attempts, quality_score, error_message, created_at, finished_at
           FROM automation_jobs ORDER BY id DESC LIMIT 30`),
    query(`SELECT id, content_type, content_key, status, quality_score, reasons, source_count, created_at
           FROM content_reviews ORDER BY id DESC LIMIT 30`),
    query(`SELECT COUNT(*) total, COUNT(DISTINCT category) categories FROM tools`),
  ]);
  const counts = await query(
    `SELECT status, COUNT(*) count FROM automation_jobs GROUP BY status`
  );
  return { available: true, jobs, reviews, tools: (tools as unknown[])?.[0], counts };
}

export async function reviewAction(id: number, action: "approve" | "reject" | "retry") {
  if (!(await ensureGrowthTables())) return false;
  if (action === "reject") {
    await query(`UPDATE content_reviews SET status='rejected', reviewed_at=CURRENT_TIMESTAMP WHERE id=?`, [id]);
    return true;
  }
  if (action === "retry") {
    const rows = await query(`SELECT payload FROM content_reviews WHERE id=? LIMIT 1`, [id]) as Array<{ payload: string }> | null;
    if (!rows?.[0]) return false;
    await enqueueGrowthJob("tool_generation", { seedDraft: parseJson(rows[0].payload) }, 80);
    return true;
  }
  const rows = await query(
    `SELECT payload, quality_score, source_count FROM content_reviews WHERE id=? AND status='pending' LIMIT 1`,
    [id]
  ) as Array<{ payload: string | ToolDraft; quality_score: number; source_count: number }> | null;
  const review = rows?.[0];
  if (!review || review.quality_score < 80 || review.source_count < 2) return false;
  const tool = typeof review.payload === "string" ? JSON.parse(review.payload) as ToolDraft : review.payload;
  await query(
    `INSERT INTO tools
      (slug,name,category,iconName,color1,color2,ease,featuresScore,basePrice,isFlat,websiteUrl,
       shortDescription,longDescription,targetAudience,verdict,pros,cons,keyFeatures)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category),
       websiteUrl=VALUES(websiteUrl), shortDescription=VALUES(shortDescription),
       longDescription=VALUES(longDescription), targetAudience=VALUES(targetAudience),
       verdict=VALUES(verdict), pros=VALUES(pros), cons=VALUES(cons), keyFeatures=VALUES(keyFeatures)`,
    [
      tool.slug, tool.name, tool.category, tool.iconName ?? "Zap",
      tool.color1 ?? "#50545f", tool.color2 ?? "#25272d", tool.ease,
      tool.featuresScore, tool.basePrice, tool.isFlat, tool.websiteUrl,
      tool.shortDescription, tool.longDescription, tool.targetAudience,
      tool.verdict, JSON.stringify(tool.pros), JSON.stringify(tool.cons),
      JSON.stringify(tool.keyFeatures),
    ]
  );
  for (const source of tool.sources ?? []) {
    await query(
      `INSERT IGNORE INTO tool_sources (tool_slug, source_type, source_url, source_title, confidence, verified_at)
       VALUES (?, ?, ?, ?, 0.750, CURRENT_TIMESTAMP)`,
      [tool.slug, source.type ?? "official", source.url, source.title ?? null]
    );
  }
  await query(`UPDATE content_reviews SET status='approved', reviewed_at=CURRENT_TIMESTAMP WHERE id=?`, [id]);
  return true;
}

function parseJson(value: string) {
  try { return JSON.parse(value); } catch { return {}; }
}
