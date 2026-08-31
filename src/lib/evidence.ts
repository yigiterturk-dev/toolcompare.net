export type EvidenceSource = {
  label: string;
  url: string;
  checkedAt: string;
  supports: string[];
};

export type ToolEvidence = {
  /*
    DURUMLAR NE IDDIA EDIYOR -- birbirine karistirilmamali:
      vendor-sourced .......... bir editor saticinin belgesini OKUDU ve hangi
                                iddiayi destekledigini tek tek yazdi (elle).
      pricing-page-verified ... saticinin fiyat sayfasi OTOMATIK cekildi, o
                                tarihte yasadigi ve fiyat icerdigi dogrulandi.
                                Kimse satir satir okumadi.
      observed / tested ....... ToolCompare'in kendi gozlemi / denemesi.
    Otomatik kontrolu "reviewed" diye yazmak, sitenin tek kozunu -- kanitin
    ne kadar kanit oldugunu -- degersizlestirirdi. Ayri durum bu yuzden var.
  */
  status: "vendor-sourced" | "pricing-page-verified" | "observed" | "tested" | "unknown";
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
  if (status === "pricing-page-verified") return "Vendor pricing page verified";
  if (status === "tested") return "Tested by ToolCompare";
  if (status === "observed") return "Observed by ToolCompare";
  return "Evidence not attached";
}
