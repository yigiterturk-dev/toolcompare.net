/**
 * PLAN MERDIVENI OKUMA KATMANI.
 *
 * `planlar` alanini scripts/plan-merdiveni.mjs uretiyor: satici fiyat
 * sayfasindan okunup kanit kaydina yazilmis cumlelerden ayiklanan
 * basamaklar. Her basamak `kaynakSatiri` ile birlikte gelir -- sayfada
 * rakami gosterirken cumlenin kendisini de gosterebilelim diye.
 *
 * NEDEN (GSC, 2026-09-10): /compare sayfalarinin ilk-20'ye girme orani
 * /tools'un 7 kati, ama 519 sayfanin 413'u hic gosterim almiyor. Sebep
 * sayfalarin birbirinin ayni olmasi. Merdiven her cifte FARKLI rakamlar
 * koyar ve uydurma icermez: sayilar zaten dogrulanmis metinden geliyor.
 */

export type Plan = {
  ad: string;
  aylik: number;
  birim: "kisi-basina" | "sabit";
  faturalama: "yillik" | "aylik" | null;
  kaynakSatiri: string;
  kaynakUrl: string | null;
};

export type MerdivenliArac = { name: string; slug: string; planlar?: Plan[] };

/** Sayfada gosterilebilecek basamaklar: sirali ve tekil. */
export function merdiven(t: MerdivenliArac): Plan[] {
  const p = Array.isArray(t.planlar) ? t.planlar : [];
  return [...p].sort((a, b) => a.aylik - b.aylik);
}

export function merdivenVar(t: MerdivenliArac): boolean {
  return merdiven(t).length >= 2;
}

/** "$16/user/mo (annual)" gibi tek satirlik etiket. */
export function planEtiketi(p: Plan): string {
  const tutar = p.aylik === 0 ? "$0" : `$${p.aylik.toLocaleString("en-US")}`;
  const birim = p.birim === "kisi-basina" ? "/user/mo" : "/mo";
  const fatura = p.faturalama === "yillik" ? " billed annually" : p.faturalama === "aylik" ? " billed monthly" : "";
  return `${tutar}${birim}${fatura}`;
}

/**
 * Ucretsiz olmayan EN UCUZ basamak. "Baslangic fiyati" diye gosterilecek
 * tek dogru rakam bu: $0 satiri bir plan ama fiyat degil.
 */
export function ilkUcretliBasamak(t: MerdivenliArac): Plan | null {
  return merdiven(t).find((p) => p.aylik > 0) ?? null;
}

/**
 * Iki aracin merdivenini kiyaslayan cumle. Yalnizca IKI tarafta da
 * ucretli basamak varsa uretilir; yoksa null -- eksik veriyle kiyas
 * yapmak, kiyas yapmamaktan kotudur.
 */
export function merdivenCumlesi(a: MerdivenliArac, b: MerdivenliArac): string | null {
  const pa = ilkUcretliBasamak(a);
  const pb = ilkUcretliBasamak(b);
  if (!pa || !pb) return null;

  /* Birimler farkliysa rakamlar ayni olcekte degil -- bunu soylemek
     zorundayiz, yoksa "$16 > $15" gibi yaniltici bir kiyas cikar. */
  if (pa.birim !== pb.birim) {
    return (
      `The two are not priced the same way: ${a.name}'s cheapest paid step is ${pa.ad} at ${planEtiketi(pa)}, ` +
      `while ${b.name}'s is ${pb.ad} at ${planEtiketi(pb)}. One scales with headcount and the other does not, ` +
      `so the cheaper option depends entirely on team size.`
    );
  }

  if (pa.aylik === pb.aylik) {
    return `Both start paid at the same number: ${pa.ad} at ${planEtiketi(pa)} for ${a.name}, ${pb.ad} at ${planEtiketi(pb)} for ${b.name}.`;
  }

  const ucuz = pa.aylik < pb.aylik ? { t: a, p: pa } : { t: b, p: pb };
  const pahali = ucuz.t === a ? { t: b, p: pb } : { t: a, p: pa };
  const kat = pahali.p.aylik / ucuz.p.aylik;
  const fark =
    kat >= 2 ? ` — ${kat.toFixed(kat >= 10 ? 0 : 1)}× the price` : "";

  return (
    `${ucuz.t.name} has the cheaper first paid step: ${ucuz.p.ad} at ${planEtiketi(ucuz.p)}, ` +
    `against ${pahali.p.ad} at ${planEtiketi(pahali.p)} for ${pahali.t.name}${fark}. ` +
    `Both figures come from the vendors' own pricing pages.`
  );
}
