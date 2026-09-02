/**
 * KANIT KAYNAGI baglantisinin rel degeri.
 *
 * Kanit kaynaklari editoryal ATIFTIR: bir fiyat veya ozellik iddiasinin
 * nereden dogrulandigini gosterirler (vendor fiyat sayfasi, dokumantasyon,
 * GitHub). Google'in yonergesi `nofollow`u UCRETLI ya da GUVENILMEYEN
 * baglantilar icin tarif eder; gercek bir atfi nofollow'lamak, sitenin
 * "bu kaynaga guveniyorum" dedigi tek yeri sessize almak demek. 402 aracin
 * 479 farkli dis alan adina verdigi atif toptan nofollow'daydi.
 *
 * TEK ISTISNA: kaynak, affiliate anlasmamiz olan bir arac icin o aracin
 * KENDI alan adina gidiyorsa takip edilmez. Ticari iliskimiz olan bir
 * alan adina editoryal gorunumlu takipli link vermek, aciklanmamis
 * ucretli baglanti gorunumu yaratir. Para kazandigimiz yere link
 * veriyorsak bunu `sponsored` ile soyleriz.
 *
 * Saf fonksiyon: veri okumaz, takma ad (@/) kullanmaz -- test edilebilsin.
 */
export function kanitRelHesapla(
  affiliateVar: boolean,
  aracSitesi: string | undefined,
  kaynakUrl: string,
): string {
  return ayniAlanAdi(affiliateVar ? aracSitesi : undefined, kaynakUrl)
    ? "noopener noreferrer sponsored"
    : "noopener noreferrer";
}

function ayniAlanAdi(aracSitesi: string | undefined, kaynakUrl: string): boolean {
  const arac = alanAdi(aracSitesi);
  const kaynak = alanAdi(kaynakUrl);
  if (!arac || !kaynak) return false;
  return kaynak === arac || kaynak.endsWith(`.${arac}`);
}

function alanAdi(url?: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}
