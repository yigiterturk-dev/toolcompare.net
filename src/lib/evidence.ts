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
      open-source-verified .... saticinin KENDI sayfasi yazilimin acik kaynak
                                ve ucretsiz oldugunu yaziyor (otomatik cekim).
                                Acik kaynak surumu kapsar; ayni saticinin
                                ucretli bulut katmani olabilir.
      observed / tested ....... ToolCompare'in kendi gozlemi / denemesi.
    Otomatik kontrolu "reviewed" diye yazmak, sitenin tek kozunu -- kanitin
    ne kadar kanit oldugunu -- degersizlestirirdi. Ayri durum bu yuzden var.
  */
  status:
    | "vendor-sourced"
    | "pricing-page-verified"
    | "open-source-verified"
    | "observed"
    | "tested"
    | "unknown";
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
  if (status === "open-source-verified") return "Open source, free — vendor page verified";
  if (status === "tested") return "Tested by ToolCompare";
  if (status === "observed") return "Observed by ToolCompare";
  return "Evidence not attached";
}

/**
 * Kanit gercekten bir RAKAM tasiyor mu?
 *
 * OLCULEN HATA (2026-09-09): katalogda `status: "pricing-page-verified"`
 * diyen 110 kaydin supports satiri tek bir sablon cumleden ibaretti --
 * "the vendor's published pricing". Yani dogrulanmis tek rakam yok, ama
 * sayfa "Vendor pricing page verified" yaziyordu. Ayni gun eklenen
 * dateModified de bu bos kaydin tarihini arama motoruna tazelik iddiasi
 * olarak gonderiyordu.
 *
 * Bulundugu yer: ahrefs $99 yaziyordu, satici sayfasinda giris plani $29
 * ve Lite $129'du. Fiyat bayatlamisti cunku dogrulama hic yapilmamisti.
 *
 * Bu yuzden "dogrulandi" iddiasi ve tarih, yalnizca rakam tasiyan
 * kayitlar icin gosterilir. Kayit indeks disi BIRAKILMAZ (bkz. indeks.ts):
 * sayfanin geri kalani -- hukum, arti/eksi, kriter tablosu -- gecerli.
 */
export function kanitRakamli(t?: { evidence?: { sources?: { label?: string; supports?: string[] }[] } }): boolean {
  const kaynaklar = t?.evidence?.sources ?? [];
  return kaynaklar.some((s) => /\d/.test([s.label ?? "", ...(s.supports ?? [])].join(" ")));
}
