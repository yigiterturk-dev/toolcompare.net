import test from "node:test";
import assert from "node:assert/strict";
import tools from "../src/data/tools.json" with { type: "json" };
import { fiyatDurumu } from "../src/lib/fiyat.ts";

/*
  NEDEN (2026-09-13): merdiveni olmayan araclarda fiyat birimi elle
  girilmis `isFlat` alanindan geliyor ve varsayilani false. Sonuc:
  koltuk basina SATILMAYAN urunler arama sonucunda "/user/mo" diye
  yaziliyordu -- hostinger "$2.99/user/mo", ionos "$1/user/mo". Ikisi de
  GSC'de sirada (hostinger-vs-ionos 18.) yani bu yanlis iddia
  goruluyordu. Kural: koltuk basina fiyat yalnizca veri bunu ACIKCA
  soyluyorsa iddia edilir -- ya merdiven basamaginin birimi
  "kisi-basina" olacak ya da model "kullanici-basina".
*/
test("koltuk basina fiyat iddiasi yalnizca veri soyluyorsa kurulur", () => {
  const hatali: string[] = [];
  for (const t of tools as { slug: string; planlar?: { birim?: string; aylik: number }[]; fiyatModeli?: string }[]) {
    const d = fiyatDurumu(t as never);
    if (!d.kisa.includes("/user/mo")) continue;
    const merdivenSoyluyor = (t.planlar ?? []).some((p) => p.aylik > 0 && p.birim === "kisi-basina");
    const modelSoyluyor = t.fiyatModeli === "kullanici-basina";
    if (!merdivenSoyluyor && !modelSoyluyor) hatali.push(`${t.slug}: ${d.kisa}`);
  }
  assert.deepEqual(hatali, [], `dayanaksiz /user/mo: ${hatali.join(", ")}`);
});

test("test gercekten bir sey deniyor", () => {
  const sayi = (tools as unknown[]).length;
  assert.ok(sayi > 400, `katalog beklenenden kucuk: ${sayi}`);
});
