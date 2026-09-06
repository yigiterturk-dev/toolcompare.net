/**
 * Sayfa basina GERCEK degisiklik tarihi.
 *
 * DENETIMDE BULUNAN (2026-09-07): sitemap'teki her adres lastModified
 * olarak `new Date()` yaziyordu -- yani her build'de 1.293 adresin
 * TAMAMI "bugun degisti" diyordu. Google bunu fark ettiginde lastmod'u
 * tamamen yok sayar; boylece gercekten degisen sayfalarin (o gun 16
 * arac sayfasi) sinyali gurultunun icinde kayboluyordu. Her sey
 * degistiyse hicbir sey degismemis demektir.
 *
 * KURAL: tarih VERIDEN gelir, saatten degil. Ayni veri = ayni tarih;
 * build tekrarlandiginda sitemap degismez. Elimizdeki tek dogrulanmis
 * tarih `evidence.reviewedAt` ve kaynak `checkedAt` degerleri -- yani
 * sayfanin icerigini gercekten degistiren an.
 */

/** Veri tarihi olmayan sayfalar icin taban. Icerik elle degisince bumplenir. */
export const TABAN_TARIH = "2026-09-07";

type Kaynak = { checkedAt?: string };
type Kanit = { reviewedAt?: string; sources?: Kaynak[] };
export type TarihliArac = { evidence?: Kanit; fiyatKontrolTarihi?: string };

const GECERLI = /^\d{4}-\d{2}-\d{2}/;

/** Verilen tarihlerin en yenisi; hicbiri gecerli degilse taban. */
export function enYeni(...tarihler: (string | undefined)[]): string {
  const g = tarihler.filter((t): t is string => typeof t === "string" && GECERLI.test(t));
  return g.length ? g.slice().sort().pop()!.slice(0, 10) : TABAN_TARIH;
}

/** Bir aracin sayfasinin en son ne zaman gercekten degistigi. */
export function aracTarihi(t: TarihliArac | undefined): string {
  if (!t) return TABAN_TARIH;
  return enYeni(
    t.fiyatKontrolTarihi,
    t.evidence?.reviewedAt,
    ...(t.evidence?.sources ?? []).map((k) => k.checkedAt),
  );
}

/**
 * Turetilmis sayfa (karsilastirma, alternatifler, kategori) icerdigi
 * araclardan olusur; en yeni arac tarihi onun da tarihidir.
 */
export function turetilmisTarih(araclar: (TarihliArac | undefined)[]): string {
  return enYeni(...araclar.map(aracTarihi));
}

/** Sitemap'e yazilacak Date. Gun basi -- saat bilgisi uydurma olurdu. */
export function tarihNesnesi(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}
