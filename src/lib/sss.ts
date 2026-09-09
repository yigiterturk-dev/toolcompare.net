/**
 * Karsilastirma sayfasinin SSS'i.
 *
 * NEDEN: /compare/* sayfalarinda FAQPage semasi hic yoktu, oysa "X vs Y"
 * insanlarin arama motoruna ve sohbet asistanina sordugu cumlenin ta
 * kendisi. Sorular yalnizca ELIMIZDEKI DOGRULANMIS veriden turetiliyor;
 * uydurma karsilastirma yok. Dogrulanmamis fiyat kiyasa girmez.
 *
 * Kural (bkz. yapilandirilmis.ts): semaya yalnizca sayfada gercekten
 * gorunen soru konur. Bu yuzden sayfa da ayni listeyi basar.
 */
import { fiyatDurumu, type Arac as FiyatArac } from "./fiyat.ts";
import { ayrimCumlesi } from "./kriter-ayrimi.ts";

export type Soru = { soru: string; cevap: string };

type Arac = FiyatArac & {
  name: string;
  kriterler?: Record<string, boolean | undefined>;
};

const UCRETSIZ_MODELLER = new Set(["bedava", "ucretsiz-katman"]);

function ucretsizCumlesi(t: Arac): string {
  const m = t.fiyatModeli;
  if (m === "bedava") return `${t.name} is free`;
  if (m === "ucretsiz-katman") return `${t.name} has a free tier with limits`;
  if (!m) return `we have not verified a free plan for ${t.name}`;
  return `${t.name} has no free plan listed`;
}

export function karsilastirmaSss(a: Arac, b: Arac): Soru[] {
  const sorular: Soru[] = [];
  const fa = fiyatDurumu(a);
  const fb = fiyatDurumu(b);

  // 1) Fiyat kiyasi: ANCAK iki taraf da dogrulanmissa.
  if (fa.karsilastirilabilir && fb.karsilastirilabilir && fa.aylik !== null && fb.aylik !== null) {
    const ucuz = fa.aylik <= fb.aylik ? a : b;
    const pahali = ucuz === a ? b : a;
    const fUcuz = ucuz === a ? fa : fb;
    const fPahali = ucuz === a ? fb : fa;
    sorular.push({
      soru: `Is ${a.name} cheaper than ${b.name}?`,
      cevap:
        fa.aylik === fb.aylik
          ? `They start at the same price: ${fUcuz.metin.replace(/^From /, "")} each. Both figures come from the vendors' own pricing pages.`
          : `${ucuz.name} is the cheaper entry point at ${fUcuz.metin.replace(/^From /, "")}, against ${fPahali.metin.replace(/^From /, "")} for ${pahali.name}. Both figures come from the vendors' own pricing pages.`,
    });
  }

  // 2) Ucretsiz plan: her iki tarafin modeli de soylenir.
  if (a.fiyatModeli || b.fiyatModeli) {
    const ikisiDe = UCRETSIZ_MODELLER.has(String(a.fiyatModeli)) && UCRETSIZ_MODELLER.has(String(b.fiyatModeli));
    sorular.push({
      soru: `Does ${a.name} or ${b.name} have a free plan?`,
      cevap: ikisiDe
        ? `Both do: ${ucretsizCumlesi(a)}, and ${ucretsizCumlesi(b)}.`
        : `${ucretsizCumlesi(a)[0].toUpperCase()}${ucretsizCumlesi(a).slice(1)}, while ${ucretsizCumlesi(b)}.`,
    });
  }

  // 3) Fark: yalnizca olculmus kriter ayrimi varsa.
  const ayrim = ayrimCumlesi(a as never, b as never);
  if (ayrim) {
    sorular.push({
      soru: `What is the difference between ${a.name} and ${b.name}?`,
      cevap: `On the criteria we check, ${ayrim} The table above lists every criterion side by side.`,
    });
  }

  return sorular;
}
