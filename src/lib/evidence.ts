export type EvidenceSource = {
  label: string;
  url: string;
  checkedAt: string;
  supports: string[];
};

export type ToolEvidence = {
  status: "vendor-sourced" | "observed" | "tested" | "unknown";
  reviewedAt: string;
  sources: EvidenceSource[];
  limitations?: string[];
};

export function toolEvidence(tool: unknown): ToolEvidence | null {
  if (!tool || typeof tool !== "object") return null;
  const evidence = (tool as { evidence?: ToolEvidence }).evidence;
  if (!evidence || !Array.isArray(evidence.sources)) return null;
  return evidence;
}

export function evidenceLabel(status: ToolEvidence["status"]): string {
  if (status === "vendor-sourced") return "Official sources reviewed";
  if (status === "tested") return "Tested by ToolCompare";
  if (status === "observed") return "Observed by ToolCompare";
  return "Evidence not attached";
}
