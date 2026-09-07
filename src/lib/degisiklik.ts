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

/*
  Cagiranlar farkli `Arac` tiplerini tutuyor (compare.ts, categories.ts) ve
  hicbiri `evidence` alanini beyan etmiyor. Yapisal tip esitligi aramak
  yerine alan OKUNUYOR: tarih metadata'si istege bagli, olmayinca taban
  tarihe dusuyoruz. Bu yuzden girdi genis, cikti dar.
*/
export type TarihliArac = unknown;

function kanitOku(t: unknown): { kanit?: Kanit; fiyatTarihi?: string } {
  if (!t || typeof t !== "object") return {};
  const o = t as { evidence?: unknown; fiyatKontrolTarihi?: unknown };
  return {
    kanit: (o.evidence && typeof o.evidence === "object" ? o.evidence : undefined) as Kanit | undefined,
    fiyatTarihi: typeof o.fiyatKontrolTarihi === "string" ? o.fiyatKontrolTarihi : undefined,
  };
}

const GECERLI = /^\d{4}-\d{2}-\d{2}/;

/** Verilen tarihlerin en yenisi; hicbiri gecerli degilse taban. */
export function enYeni(...tarihler: (string | undefined)[]): string {
  const g = tarihler.filter((t): t is string => typeof t === "string" && GECERLI.test(t));
  return g.length ? g.slice().sort().pop()!.slice(0, 10) : TABAN_TARIH;
}

/** Bir aracin sayfasinin en son ne zaman gercekten degistigi. */
export function aracTarihi(t: TarihliArac | undefined): string {
  if (!t) return TABAN_TARIH;
  const { kanit, fiyatTarihi } = kanitOku(t);
  return enYeni(
    fiyatTarihi,
    kanit?.reviewedAt,
    ...(kanit?.sources ?? []).map((k) => k.checkedAt),
  );
}

/**
 * Turetilmis sayfa (karsilastirma, alternatifler, kategori) icerdigi
 * araclardan olusur; en yeni arac tarihi onun da tarihidir.
 */
export function turetilmisTarih(araclar: readonly (TarihliArac | undefined)[]): string {
  return enYeni(...araclar.map(aracTarihi));
}

/** Sitemap'e yazilacak Date. Gun basi -- saat bilgisi uydurma olurdu. */
export function tarihNesnesi(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}
