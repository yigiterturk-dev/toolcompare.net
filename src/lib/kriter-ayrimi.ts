/*
  Kriter ayrimi compare.ts'ten AYRI dosyada duruyor: compare.ts tools.json'u
  `@/data` takma adiyla cekiyor ve testler (node --test) o takma adi
  cozemiyor. Buradaki mantik saf -- katalogdan bagimsiz, dogrudan test
  edilebilir. compare.ts bunu yeniden disa aktariyor.
*/
import { KRITER_SIRA, KRITER_ETIKET, type Kriter, type KriterKumesi } from "./kriterler.ts";

export type AyrimGirdisi = { name: string; kriterler?: KriterKumesi };
/**
 * Iki aracin OLCULEN ozelliklerinde nerede ayristigi.
 *
 * NEDEN VAR: karsilastirma sayfalarinin metni cift degistikce degismiyordu --
 * olculdu, sayfalar birbirinin %53-59'u. Tabloda "Yes/No" olarak duran veri
 * cumleye hic donusmuyordu. Bu fonksiyon o veriden CIFTE OZGU bir cumle
 * uretiyor: aciklama uydurulmuyor, yalnizca zaten dogrulanmis alanlar
 * okunuyor.
 *
 * `null`/eksik deger BAKILMADI demek (bkz. kriterler.ts) -- bir ayrim
 * ancak IKI TARAF DA bilindiginde ve degerler farkli oldugunda sayilir.
 */
export function kriterAyrimi(a: AyrimGirdisi, b: AyrimGirdisi) {
  const sadeceA: Kriter[] = [];
  const sadeceB: Kriter[] = [];
  const ortak: Kriter[] = [];
  for (const k of KRITER_SIRA) {
    const va = a.kriterler?.[k];
    const vb = b.kriterler?.[k];
    if (typeof va !== "boolean" || typeof vb !== "boolean") continue;
    if (va && !vb) sadeceA.push(k);
    else if (vb && !va) sadeceB.push(k);
    else if (va && vb) ortak.push(k);
  }
  return { sadeceA, sadeceB, ortak };
}

function liste(parcalar: string[]): string {
  if (parcalar.length <= 1) return parcalar.join("");
  if (parcalar.length === 2) return `${parcalar[0]} and ${parcalar[1]}`;
  return `${parcalar.slice(0, -1).join(", ")} and ${parcalar[parcalar.length - 1]}`;
}

/**
 * Ayrimin okunabilir hali. Ayrim yoksa bos string doner -- cagiran taraf
 * satiri hic basmaz. "Ikisi de ayni" gibi dolgu cumle yazmiyoruz; sayfaya
 * kelime eklemek amac degil, AYIRT EDICI kelime eklemek amac.
 */
export function ayrimCumlesi(a: AyrimGirdisi, b: AyrimGirdisi): string {
  const { sadeceA, sadeceB, ortak } = kriterAyrimi(a, b);
  const etiket = (k: Kriter) => KRITER_ETIKET[k].toLowerCase();
  const cumleler: string[] = [];
  if (sadeceA.length) cumleler.push(`only ${a.name} has ${liste(sadeceA.map(etiket))}`);
  if (sadeceB.length) cumleler.push(`only ${b.name} has ${liste(sadeceB.map(etiket))}`);
  if (!cumleler.length) {
    if (!ortak.length) return "";
    return `on what we checked they match — both offer ${liste(ortak.map(etiket))}.`;
  }
  const kuyruk = ortak.length ? `; both offer ${liste(ortak.map(etiket))}` : "";
  return `${liste(cumleler)}${kuyruk}.`;
}
