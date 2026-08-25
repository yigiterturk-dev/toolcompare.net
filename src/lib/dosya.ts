import fs from "fs";

/**
 * Atomik dosya yazimi.
 *
 * DENETIMDE BULUNAN (2026-08-25): dogrudan fs.writeFileSync() iki eszamanli
 * istekte dosyayi YARIDA KESIK birakabiliyordu -- okuyan tarafa bozuk JSON.
 * Once gecici dosyaya yazip rename ediyoruz; ayni dosya sisteminde rename
 * atomiktir, okuyan taraf ya eski ya yeni icerigi gorur, asla yarimini degil.
 */
export function guvenliYaz(yol: string, veri: string): void {
  const gecici = `${yol}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(gecici, veri, "utf8");
  fs.renameSync(gecici, yol);
}