/**
 * CEKIRDEK: Google'in bu siteden FIILEN tuttugu sayfalar.
 *
 * NEDEN (olcum, 2026-10-14): 22 Eylul'de site duzeyinde dusus -- 14 gunde
 * gosterim alan sayfa 699 -> 68, haftalik gosterim 8.210 -> 108. Teknik
 * ariza yok (bkz. hafiza 10-08 teshisi): Google programatik sayfa yiginini
 * "scaled content" olarak eledi. /compare 1.768 -> 9, /alternatives
 * 1.504 -> 1 gosterim.
 *
 * KARAR: siteyi Google'in hala indekste tuttugu cekirdege daraltmak. Bu
 * kume DISINDAKI /tools, /compare, /alternatives sayfalari `noindex,
 * follow` olur ve sitemap'ten cikar. Sayfalar silinmez (404 dalgasi yok),
 * linkler akmaya devam eder.
 *
 * Bu, talep.ts'in "talep sayfa elemez" kuralinin BILINCLI istisnasidir:
 * o kural Google'in henuz bakmadigi sayfalar icindi. Burada Google
 * bakti, taradi ve reddetti ("Crawled - currently not indexed").
 *
 * Kume = URL Inspection PASS ∪ son 14 gunde (22 Eylul sonrasi) gosterim. Tazelemek icin
 * scratchpad cekirdek-uret.mjs yeniden calistirilir; cekirdege bir sayfa
 * EKLEMEK ancak Google onu kendisi indekslediginde olur.
 */
import ham from "../data/gsc/cekirdek.json" with { type: "json" };

const YOLLAR = new Set((ham as { yollar?: string[] }).yollar || []);

/** Veri yoksa (bos klon) kapi devre disi: eski kapilar tek basina karar verir. */
export const CEKIRDEK_VAR = YOLLAR.size > 0 && process.env.CEKIRDEK_KAPALI !== "1";
// CEKIRDEK_KAPALI=1: testler eski kapilarin kendi mantigini olcer (tests/canli/ haric).

export function cekirdekte(yol: string): boolean {
  if (!CEKIRDEK_VAR) return true;
  return YOLLAR.has(yol.replace(/\/$/, "") || "/");
}
