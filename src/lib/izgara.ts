/**
 * ANASAYFA IZGARASINA GECEN KAYIT.
 *
 * NEDEN AYRI DOSYA (2026-09-12): kirpma mantigi page.tsx'in icindeydi ve
 * denetim betigi (scripts/check-izgara-alanlari.mjs) yalnizca ALAN
 * LISTESINI okuyup kirpmayi kendisi taklit ediyordu. Taklit, turetilmis
 * alanlari goremez: fiyat merdiveni izgaraya turetilmis bicimde gecince
 * betik hala eski celiskiyi raporladi. Mantik tek yerde durursa hem sayfa
 * hem denetim AYNI seyi calistirir -- betigin kendi basligindaki kural
 * budur: olculen sey iddianin ta kendisi olmali.
 *
 * NEDEN KIRPILIYOR (olcum, 2026-08-31): tam kayit gecilince dokuman
 * 518 KB'a cikiyordu; gorunur metin 5 KB'ti. `keyFeatures` tek basina
 * 124.7 KB tutuyordu ve ToolCard ondan yalnizca ilk uc BASLIGI okuyor.
 */
import { ilkUcretliBasamak } from "./plan.ts";

/** Izgaranin gercekten okudugu ham alanlar. */
export const IZGARA_ALANLARI = [
  "slug", "name", "category", "shortDescription",
  "basePrice", "isFlat", "fiyatModeli", "features", "keyFeatures",
] as const;

/**
 * Tam kayittan izgara kaydi.
 *
 * Ham `planlar` GECMEZ: 502 basamagin `kaynakSatiri` metinleri istemciye
 * yuz KB'lar ekler ve izgara o cumleleri hic gostermez. Gecen tek sey,
 * fiyatDurumu()'nun ihtiyaci olan en ucuz UCRETLI basamak. Kaynak cumlesi
 * urun sayfasinda, rakamin yaninda duruyor; orasi onun yeri.
 *
 * DENETIMDE BULUNAN (2026-09-12): merdiven fiyatin tek yorumlayicisina
 * baglandigi gun izgara hala `basePrice` okuyordu -- descript urun
 * sayfasinda "$16/mo", anasayfada "$12/user/mo"; loom "$18/user/mo" vs
 * "$12/user/mo". `fiyatModeli` ile 2026-08-25'te yasanan hatanin aynisi.
 */
export function izgaraKaydi(tam: Record<string, unknown>): Record<string, unknown> {
  const kucuk: Record<string, unknown> = {};
  for (const alan of IZGARA_ALANLARI) if (tam?.[alan] !== undefined) kucuk[alan] = tam[alan];

  const kf = kucuk.keyFeatures as { title?: string }[] | undefined;
  if (kf) {
    kucuk.keyFeatures = kf
      .slice(0, 3)
      .map((f) => (typeof f === "string" ? f : (f?.title ?? "")))
      .filter(Boolean);
  }

  const basamak = ilkUcretliBasamak(tam as never);
  if (basamak) {
    kucuk.planlar = [
      {
        ad: basamak.ad,
        aylik: basamak.aylik,
        birim: basamak.birim,
        faturalama: basamak.faturalama,
        kaynakSatiri: "",
        kaynakUrl: null,
      },
    ];
  }
  return kucuk;
}
