/**
 * BENZER ARACLAR: arac sayfalarindan arac sayfalarina giden DOGRUDAN link.
 *
 * Neden ayri bir katman: arac sayfasi bugune kadar baska bir arac
 * sayfasina HIC link vermiyordu. Verdigi tek "akran" baglantisi
 * /compare/<a>-vs-<b> adresineydi, o da iki kapiya birden bagliydi --
 * aracin islevi bilinecek (src/lib/islev.ts) VE ciftin indekslenebilir
 * olmasi gerekmiyordu ama cift URETILMIS olmaliydi. Olculdu: 518 aracin
 * 41'inin islevi yok; o sayfalarin derlenmis HTML'inde kendi kategorisi
 * disinda tek bir ic link bile yok. Katalogun geri kalani da birbirine
 * yalnizca karsilastirma sayfalari uzerinden, yani bir sicrama fazladan
 * mesafeden baglaniyordu.
 *
 * Buradaki secim SIRALI iki olcute dayanir ve hangisinin kullanildigi
 * disari bildirilir -- sayfada "ayni isi yapan araclar" ile "ayni
 * kategoriden araclar" ayni cumleyle sunulamaz, ikincisi cok daha zayif
 * bir iddiadir.
 */

import toolsData from "../data/tools.json" with { type: "json" };
import type { Arac } from "./arac";
import { islevi } from "./islev.ts";
import { kategoriSlug } from "./categories.ts";
import { fiyatDurumu } from "./fiyat.ts";

const araclar = toolsData as Arac[];

export const BENZER_ADEDI = 6;

/** Fiyati dogrulanmislar once, ucuzdan pahaliya; gerisi ada gore. */
function siralamaKarsilastir(a: Arac, b: Arac): number {
  const da = fiyatDurumu(a);
  const db = fiyatDurumu(b);
  const ga = da.karsilastirilabilir && da.aylik !== null ? 0 : 1;
  const gb = db.karsilastirilabilir && db.aylik !== null ? 0 : 1;
  if (ga !== gb) return ga - gb;
  if (ga === 0 && da.aylik !== db.aylik) return (da.aylik as number) - (db.aylik as number);
  return a.name.localeCompare(b.name);
}

export type Benzerlik = {
  /** "islev": ayni isi yapan araclar. "kategori": yalnizca ayni kategori. */
  kaynak: "islev" | "kategori";
  araclar: Arac[];
};

/**
 * Bir aracin benzerleri.
 *
 * Once ayni ISLEVLI araclar (guclu iddia). Islev yoksa ya da islev
 * grubu tek basinaysa ayni KATEGORIDEN araclar (zayif iddia, oyle
 * etiketlenir). Liste hicbir zaman aracin kendisini icermez.
 *
 * `haricTut`: sayfada zaten linklenmis sluglar. Ayni araca iki satir
 * yukarida "X vs Y" rozetiyle, iki satir asagida "benzer arac"
 * kartiyla link vermek ziyaretciye tekrar, tarayiciya da ayni hedefe
 * ikinci bir link demektir; ikisi de ise yaramaz.
 */
export function benzerAraclar(
  slug: string,
  adet: number = BENZER_ADEDI,
  haricTut: readonly string[] = [],
): Benzerlik | null {
  const arac = araclar.find((t) => t.slug === slug);
  if (!arac) return null;

  const disarida = new Set([slug, ...haricTut]);
  const i = islevi(slug);

  if (i !== null) {
    const ayniIslev = araclar
      .filter((t) => !disarida.has(t.slug) && islevi(t.slug) === i)
      .sort(siralamaKarsilastir);
    if (ayniIslev.length > 0) {
      return { kaynak: "islev", araclar: ayniIslev.slice(0, adet) };
    }
  }

  if (!arac.category) return null;
  const kat = kategoriSlug(arac.category);
  const ayniKategori = araclar
    .filter((t) => !disarida.has(t.slug) && t.category && kategoriSlug(t.category) === kat)
    .sort(siralamaKarsilastir);
  if (ayniKategori.length === 0) return null;

  return { kaynak: "kategori", araclar: ayniKategori.slice(0, adet) };
}
