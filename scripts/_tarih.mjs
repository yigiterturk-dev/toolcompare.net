/**
 * Yerel takvim gunu (YYYY-AA-GG).
 *
 * Neden var: kanit scriptleri `new Date().toISOString().slice(0,10)` ile
 * tarih uretiyordu. toISOString UTC'ye cevirir; Turkiye UTC+3 oldugu icin
 * gece yarisi ile 03:00 arasinda calisan bir script BIR ONCEKI gunu
 * yaziyordu. Bu tarih `evidence.checkedAt` / `reviewedAt` alanina giriyor
 * ve sitede "su tarihte dogrulandi" diye OKURA gosteriliyor - yani hata
 * gorunur bir hata.
 *
 * `sv-SE` yerel ayari tam olarak YYYY-MM-DD uretir; elle ay/gun doldurmaya
 * gerek birakmaz.
 */
export function yerelTarih(d = new Date()) {
  return d.toLocaleDateString("sv-SE");
}
