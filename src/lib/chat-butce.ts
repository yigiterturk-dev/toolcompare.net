/**
 * Sohbet ucunun PARA freni.
 *
 * OLCULDU (2026-08-31): `/api/chat` her istekte 512 aracin tamamini sistem
 * istemine gomuyordu -- istek basina ~14.741 jeton, YALNIZCA baglam icin.
 * Tek IP izinli hizda (10/dk) 24 saatte ~$32 yakiyor; IP degistiren biri
 * icin hicbir tavan yok. Ustelik `max_tokens` verilmedigi icin cikti da
 * sinirsizdi.
 *
 * Iki ayri fren, cunku tek basina ikisi de yetmiyor:
 *   - IP freni (adminAuth.hizFreni) tek kotu niyetliyi yavaslatir ama
 *     X-Forwarded-For taklit edilebiliyorsa asilabilir.
 *   - GUNLUK TOPLAM tavan kaynaktan bagimsizdir; asilamaz. Fatura
 *     ustunde son soz bu.
 *
 * Sayac tek surec bellekte. Site Hostinger'da TEK Node surecinde
 * calisiyor (bkz. app.js/npm start), yani bu dogru sayiyor; surec yeniden
 * baslarsa sifirlanir -- kabul edilebilir, cunku amac tavani asan
 * suistimali kesmek, muhasebe tutmak degil.
 */

/** Gunluk toplam model cagrisi tavani. */
export const GUNLUK_TAVAN = Number(process.env.CHAT_DAILY_CALL_LIMIT ?? 300);

/** Tek yanitta uretilecek en fazla jeton. Ciktinin da bir tavani olmali. */
export const YANIT_JETON_TAVANI = Number(process.env.CHAT_MAX_OUTPUT_TOKENS ?? 500);

/** Sistem istemine girecek en fazla arac. */
export const BAGLAM_ARAC_TAVANI = Number(process.env.CHAT_CONTEXT_TOOLS ?? 40);

let gun = "";
let sayac = 0;

function bugun(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Bugunku cagri sayisi. */
export function gunlukSayac(): number {
  return bugun() === gun ? sayac : 0;
}

/**
 * Bir model cagrisi icin butce ayir. Tavan dolduysa `false` doner ve
 * cagri YAPILMAZ.
 */
export function butceAyir(): boolean {
  const g = bugun();
  if (g !== gun) {
    gun = g;
    sayac = 0;
  }
  if (sayac >= GUNLUK_TAVAN) return false;
  sayac += 1;
  return true;
}

/** Test icin. Uretimde cagrilmiyor. */
export function butceSifirla(): void {
  gun = "";
  sayac = 0;
}

/**
 * Ziyaretcinin mesajina GORE arac secimi.
 *
 * Onceden 512 aracin hepsi gonderiliyordu. Bu hem pahali hem de kotu bir
 * istem: modele 512 secenek verip "en iyi 2-3'unu sec" demek, ilgili 40
 * secenek verip aynisini demekten daha iyi cevap uretmiyor.
 *
 * Puanlama kasitli olarak APTAL ve bedava: mesajin kelimeleri arac adi,
 * kategori ve kisa aciklamada geciyor mu. Eslesme yoksa gelisiguzel bir
 * kirpma degil, KATEGORI TEMSILI donuyor -- her kategoriden birer arac --
 * ki "muhasebe araci lazim" gibi genel soruda katalog yine temsil edilsin.
 */
export function baglamSec<T extends { name?: string; category?: string; shortDescription?: string; basePrice?: number }>(
  araclar: T[],
  mesaj: string,
  tavan: number = BAGLAM_ARAC_TAVANI,
): T[] {
  const kelimeler = mesaj
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((k) => k.length > 2);

  if (kelimeler.length) {
    const puanli = araclar
      .map((t) => {
        const metin = `${t.name ?? ""} ${t.category ?? ""} ${t.shortDescription ?? ""}`.toLowerCase();
        let puan = 0;
        for (const k of kelimeler) {
          if (!metin.includes(k)) continue;
          // Ad ve kategoride gecmesi, aciklamada gecmesinden agir basar.
          puan += `${t.name ?? ""} ${t.category ?? ""}`.toLowerCase().includes(k) ? 3 : 1;
        }
        return { t, puan };
      })
      .filter((x) => x.puan > 0)
      .sort((a, b) => b.puan - a.puan);

    if (puanli.length) return puanli.slice(0, tavan).map((x) => x.t);
  }

  // Eslesme yok: her kategoriden birer temsilci.
  const gorulen = new Set<string>();
  const temsil: T[] = [];
  for (const t of araclar) {
    const k = t.category ?? "";
    if (gorulen.has(k)) continue;
    gorulen.add(k);
    temsil.push(t);
    if (temsil.length >= tavan) break;
  }
  return temsil;
}
