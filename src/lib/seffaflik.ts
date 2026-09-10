/**
 * FIYAT SEFFAFLIGI OLCUMU (/research/pricing-transparency'nin tek kaynagi).
 *
 * NEDEN VAR: sitenin otoritesi yok (GSC 2026-09-08: 626 URL'nin tamami
 * indeksli, hicbir teknik engel yok, ortalama sira 54; GSC Links raporu
 * "processing data" -- yani raporlanacak dis link YOK). On-page cila bu
 * tabloyu degistirmiyor. Otorite atifla gelir, atif da baskasinin
 * alintilayacagi bir OLCUM ister. Karsilastirma sayfasini kimse
 * linklemez; "SaaS'larin %43'unde fiyat rakami bulunamiyor, en kotusu
 * e-ticaret" cumlesi linklenir.
 *
 * Elimizdeki hammadde bu iddiayi tasiyabilecek tek sey: 512 urunun fiyat
 * sayfasi elle acilip okundu, her iddia kaynak URL'si ve okunma tarihiyle
 * duruyor (bkz. /data).
 *
 * IKI DURUSTLUK KURALI -- ikisi de yayimlanan sayiyi belirliyor:
 *
 *   1. Kanit kaydi OLMAYAN urun olcume GIRMEZ. 512'nin 40'inda hicbir
 *      kaynak yok; bunlar "satici yayinlamamis" degil, "biz bakmamisiz"
 *      demek. Ikisini ayni kefeye koymak, ilk itiraz eden kisiye tum
 *      calismayi curutme imkani verir. Payda bu yuzden 472.
 *
 *   2. Olculen sey "satici fiyatini GIZLIYOR" DEGIL, "saticinin kendi
 *      sayfasinda okunabilir bir rakam BULUNAMADI". Fark onemli: rakam
 *      JS ile geliyor olabilir, bolgesel para biriminde olabilir, ya da
 *      urun gercekten kullanim bazli fiyatlanıyor olabilir. Sayfa da
 *      bunu boyle yazmak zorunda. Bu yuzden bulunamayanlar tek torbaya
 *      atilmiyor, SEBEBE gore ayriliyor.
 */

import type { Arac } from "@/lib/arac";

/** Rakamin neden bulunamadigi. Tek torba yerine sebep -- bkz. kural 2. */
export type BulunamamaSebebi =
  /** Satici yalnizca "teklif alin" diyor (fiyatModeli: teklif). */
  | "quote-only"
  /** Ucretsiz katman duyurulmus ama ucretli planin rakami yok. */
  | "free-tier-only"
  /** Islem/kullanim basina fiyatlaniyor; tek bir aylik rakam anlamsiz. */
  | "usage-based"
  /** Fiyat sayfasi okundu, hicbir rakam yayinlanmamis. */
  | "no-figure-published";

export type SeffaflikKaydi = {
  slug: string;
  name: string;
  category: string;
  /** Saticinin kendi sayfasinda okunabilir bir rakam var mi. */
  rakamVar: boolean;
  /** rakamVar false ise sebebi. */
  sebep: BulunamamaSebebi | null;
  /** Kanitin okundugu tarih (evidence.reviewedAt). */
  okunmaTarihi: string | null;
  /** Kanit kaynagi sayisi -- kaydin agirligi. */
  kaynakSayisi: number;
};

export type KategoriSatiri = {
  kategori: string;
  incelenen: number;
  rakamsiz: number;
  oran: number;
};

export type SeffaflikOzeti = {
  /** Katalogdaki toplam urun. */
  toplam: number;
  /** Olcume giren (kanit kaydi olan) urun -- payda. */
  incelenen: number;
  /** Kanit kaydi olmadigi icin DISARIDA birakilan urun. */
  haricTutulan: number;
  rakamVar: number;
  rakamsiz: number;
  /** Rakamsizlarin tum incelenen icindeki orani, yuzde (bir ondalik). */
  rakamsizYuzde: number;
  sebepler: Record<BulunamamaSebebi, number>;
  kategoriler: KategoriSatiri[];
  kayitlar: SeffaflikKaydi[];
};

/**
 * Kategori satiri yayimlanmak icin en az bu kadar incelenmis urun ister.
 * Kucuk orneklemden "HR yazilimlarinin %67'si" cikarmak, olcumu
 * curutulebilir kilar; 12 alti kategoriler ozette toplaniyor.
 */
export const ASGARI_ORNEKLEM = 12;

/** Kanit kaydi (kaynakli) olan urun olcume girer. */
function olcumeGirer(t: Arac): boolean {
  const kaynaklar = t.evidence?.sources;
  return Array.isArray(kaynaklar) && kaynaklar.length > 0;
}

/** planlar[] icinde sifirdan buyuk aylik rakam var mi. */
function planRakamiVar(t: Arac): boolean {
  const planlar = (t as { planlar?: { aylik?: unknown }[] }).planlar;
  if (!Array.isArray(planlar)) return false;
  return planlar.some((p) => typeof p.aylik === "number" && p.aylik > 0);
}

/**
 * Saticinin kendi sayfasinda okunabilir bir rakam var mi.
 * "bedava"/"ucretsiz" de RAKAMDIR: $0 yayimlanmis bir fiyattir, bilinmeyen
 * bir fiyat degil. Bunu rakamsiz saymak orani yapay sekilde sisirirdi.
 */
export function rakamBulundu(t: Arac): boolean {
  if (t.fiyatModeli === "bedava" || t.fiyatModeli === "ucretsiz") return true;
  if (typeof t.basePrice === "number" && t.basePrice > 0) return true;
  return planRakamiVar(t);
}

export function bulunamamaSebebi(t: Arac): BulunamamaSebebi {
  const fm = t.fiyatModeli;
  if (fm === "teklif") return "quote-only";
  if (fm === "ucretsiz-katman" || fm === "ucretsiz-kredi") return "free-tier-only";
  if (
    fm === "kullanima-gore" ||
    fm === "kullanim-bazli" ||
    fm === "degisken" ||
    fm === "urun-bazli" ||
    fm === "abonelik-arti-islem"
  ) {
    return "usage-based";
  }
  return "no-figure-published";
}

export function seffaflikOzeti(araclar: Arac[]): SeffaflikOzeti {
  const incelenenler = araclar.filter(olcumeGirer);

  const kayitlar: SeffaflikKaydi[] = incelenenler.map((t) => {
    const varMi = rakamBulundu(t);
    return {
      slug: t.slug,
      name: t.name,
      category: t.category,
      rakamVar: varMi,
      sebep: varMi ? null : bulunamamaSebebi(t),
      okunmaTarihi: t.evidence?.reviewedAt ?? null,
      kaynakSayisi: t.evidence?.sources?.length ?? 0,
    };
  });

  const sebepler: Record<BulunamamaSebebi, number> = {
    "quote-only": 0,
    "free-tier-only": 0,
    "usage-based": 0,
    "no-figure-published": 0,
  };
  for (const k of kayitlar) if (k.sebep) sebepler[k.sebep] += 1;

  const sayac = new Map<string, { n: number; x: number }>();
  for (const k of kayitlar) {
    const s = sayac.get(k.category) ?? { n: 0, x: 0 };
    s.n += 1;
    if (!k.rakamVar) s.x += 1;
    sayac.set(k.category, s);
  }

  const kategoriler: KategoriSatiri[] = [...sayac.entries()]
    .filter(([, s]) => s.n >= ASGARI_ORNEKLEM)
    .map(([kategori, s]) => ({
      kategori,
      incelenen: s.n,
      rakamsiz: s.x,
      oran: s.n === 0 ? 0 : s.x / s.n,
    }))
    .sort((a, b) => b.oran - a.oran || b.incelenen - a.incelenen);

  const rakamVar = kayitlar.filter((k) => k.rakamVar).length;
  const rakamsiz = kayitlar.length - rakamVar;

  return {
    toplam: araclar.length,
    incelenen: kayitlar.length,
    haricTutulan: araclar.length - kayitlar.length,
    rakamVar,
    rakamsiz,
    rakamsizYuzde: kayitlar.length === 0 ? 0 : Math.round((rakamsiz / kayitlar.length) * 1000) / 10,
    sebepler,
    kategoriler,
    kayitlar,
  };
}

/** Atif zorunlulugu tasiyan CSV. Alan adlari veri sozlesmesidir; degistirme. */
export function seffaflikCsv(ozet: SeffaflikOzeti): string {
  const basliklar = ["slug", "name", "category", "price_figure_found", "reason", "evidence_reviewed_at", "source_count"];
  const kacir = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const satirlar = ozet.kayitlar.map((k) =>
    [
      k.slug,
      kacir(k.name),
      kacir(k.category),
      k.rakamVar ? "yes" : "no",
      k.sebep ?? "",
      k.okunmaTarihi ?? "",
      String(k.kaynakSayisi),
    ].join(","),
  );
  return [basliklar.join(","), ...satirlar].join("\n") + "\n";
}
