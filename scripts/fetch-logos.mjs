/*
  Arac logolarini DERLEME ZAMANINDA indirir ve public/logos/ altina yazar.

  Neden yerel: site "izleyici yok, ucuncu taraf istegi yok" diyor. Logolari
  calisma aninda bir favicon servisinden cekmek bu iddiayi bozardi -- her
  ziyaretcinin tarayicisi o servise istek atardi. Bir kez indirilip depoya
  konuyor; ziyaretcinin tarayicisi yalnizca bizim sunucumuzla konusuyor.

  Kaynak sirasi: DuckDuckGo ikon servisi -> Google s2. Ikisi de basarisizsa
  arac logosuz kalir ve arayuz harf rozetine duser (ToolCard bunu zaten
  yapiyor).

  Yeniden calistirilabilir: var olan dosyalari atlar, yalnizca eksikleri
  dener. `--force` ile hepsini yeniler.
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..");
const cikti = join(kok, "public/logos");
mkdirSync(cikti, { recursive: true });

const zorla = process.argv.includes("--force");
const araclar = JSON.parse(readFileSync(join(kok, "src/data/tools.json"), "utf8"));

/** Cok kucuk dosyalar genelde "bulunamadi" yer tutucusudur. */
const EN_AZ_BAYT = 300;

function alanAdi(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function indir(url) {
  const c = new AbortController();
  const zamanlayici = setTimeout(() => c.abort(), 12000);
  try {
    const res = await fetch(url, { signal: c.signal, redirect: "follow" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length >= EN_AZ_BAYT ? buf : null;
  } catch {
    return null;
  } finally {
    clearTimeout(zamanlayici);
  }
}

async function logoGetir(host) {
  return (
    (await indir(`https://icons.duckduckgo.com/ip3/${host}.ico`)) ??
    (await indir(`https://www.google.com/s2/favicons?domain=${host}&sz=128`))
  );
}

const isler = araclar
  .filter((t) => t.slug && t.websiteUrl)
  .map((t) => ({ slug: t.slug, host: alanAdi(t.websiteUrl) }))
  .filter((t) => t.host);

let indirilen = 0;
let atlanan = 0;
let basarisiz = [];

const ES_ZAMANLI = 12;
let sira = 0;

async function isci() {
  while (sira < isler.length) {
    const { slug, host } = isler[sira++];
    const yol = join(cikti, `${slug}.ico`);
    if (!zorla && existsSync(yol) && statSync(yol).size >= EN_AZ_BAYT) {
      atlanan++;
      continue;
    }
    const buf = await logoGetir(host);
    if (buf) {
      writeFileSync(yol, buf);
      indirilen++;
    } else {
      basarisiz.push(`${slug} (${host})`);
    }
  }
}

await Promise.all(Array.from({ length: ES_ZAMANLI }, isci));

/*
  Inen dosyalar .ico ve bazilari 280 KB'a kadar cikan cok cozunurluklu
  paketler. Kart izgarasinda bu agir kalir; hepsi 64px PNG'ye indiriliyor
  (en buyuk dosya 285 KB -> 9 KB, toplam 6 MB -> 3 MB).
*/
for (const t of isler) {
  const ico = join(cikti, `${t.slug}.ico`);
  if (!existsSync(ico)) continue;
  const png = join(cikti, `${t.slug}.png`);
  const r = spawnSync("sips", ["-s", "format", "png", "-Z", "64", ico, "--out", png], { stdio: "ignore" });
  if (r.status === 0) rmSync(ico, { force: true });
}

// Arayuzun "logo var mi" diye diske bakmasi gerekmesin: manifest yaziliyor.
const manifest = {};
for (const t of araclar) {
  if (!t.slug) continue;
  for (const uzanti of [".png", ".ico"]) {
    if (existsSync(join(cikti, `${t.slug}${uzanti}`))) { manifest[t.slug] = uzanti; break; }
  }
}
writeFileSync(join(kok, "src/data/logos.json"), JSON.stringify(manifest) + "\n");

console.log(`logo: ${indirilen} indirildi, ${atlanan} atlandi, ${basarisiz.length} bulunamadi`);
console.log(`manifest: ${Object.keys(manifest).length}/${araclar.length} aracin logosu var`);
if (basarisiz.length) console.log("bulunamayanlar (ilk 10):", basarisiz.slice(0, 10).join(", "));
