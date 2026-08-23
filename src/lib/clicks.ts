/**
 * Tik kaydi ve okumasi.
 *
 * NEDEN IKI DEPO: /go/ katmanini olcum icin kurduk, ama olcum MySQL
 * ortam degiskenlerine bagliydi -- tanimli degilse hicbir sey yazilmiyor
 * ve katman amacini kaybediyordu. Simdi MySQL varsa oraya, yoksa diske
 * satir satir JSON'a yaziliyor. Boylece "olcum yok" durumu olusamiyor.
 *
 * Diskteki dosya kalici bir veri deposu degil, guvenlik agi: MySQL
 * baglandiginda asil kayit oraya gider.
 *
 * Kisisel veri saklanmaz: IP ve user-agent yazilmaz. Cevaplamak
 * istedigimiz soru "hangi arac ilgi cekiyor", "bu ziyaretci kim" degil.
 */

import fs from "fs";
import path from "path";
import { query } from "@/lib/db";

export type TikOzeti = { slug: string; adet: number; son: string | null };

const dosyaYolu = path.join(process.cwd(), ".data", "clicks.jsonl");

function mysqlVarMi(): boolean {
  return Boolean(process.env.DB_NAME && process.env.DB_USER);
}

// ── Yazma ─────────────────────────────────────────────────────────────

function diskeYaz(slug: string, referer: string | null) {
  try {
    fs.mkdirSync(path.dirname(dosyaYolu), { recursive: true });
    const satir = JSON.stringify({
      slug,
      referer: referer ? referer.slice(0, 500) : null,
      clicked_at: new Date().toISOString(),
    });
    fs.appendFileSync(dosyaYolu, satir + "\n", "utf8");
  } catch {
    // Yutuluyor: olcum kaybi kabul edilebilir, yonlendirme kaybi degil.
  }
}

async function mysqleYaz(slug: string, referer: string | null) {
  await query(
    `CREATE TABLE IF NOT EXISTS outbound_clicks (
       id INT AUTO_INCREMENT PRIMARY KEY,
       slug VARCHAR(255) NOT NULL,
       referer VARCHAR(500),
       clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       INDEX idx_slug (slug),
       INDEX idx_clicked_at (clicked_at)
     )`
  );
  await query(`INSERT INTO outbound_clicks (slug, referer) VALUES (?, ?)`, [
    slug,
    referer ? referer.slice(0, 500) : null,
  ]);
}

/** Tiki kaydeder. ASLA hata firlatmaz -- cagiran yonlendirmeyi surdurur. */
export async function tikiKaydet(slug: string, referer: string | null): Promise<void> {
  if (mysqlVarMi()) {
    try {
      await mysqleYaz(slug, referer);
      return;
    } catch {
      // MySQL patladiysa veri kaybetmeyelim, diske dus.
    }
  }
  diskeYaz(slug, referer);
}

// ── Okuma ─────────────────────────────────────────────────────────────

function disktenOku(): TikOzeti[] {
  try {
    const ham = fs.readFileSync(dosyaYolu, "utf8");
    const sayac = new Map<string, { adet: number; son: string }>();
    for (const satir of ham.split("\n")) {
      if (!satir.trim()) continue;
      try {
        const k = JSON.parse(satir);
        const mevcut = sayac.get(k.slug);
        if (mevcut) {
          mevcut.adet += 1;
          if (k.clicked_at > mevcut.son) mevcut.son = k.clicked_at;
        } else {
          sayac.set(k.slug, { adet: 1, son: k.clicked_at });
        }
      } catch {
        // Bozuk satiri atla; tek satir yuzunden tum rapor kaybolmasin.
      }
    }
    return [...sayac.entries()]
      .map(([slug, v]) => ({ slug, adet: v.adet, son: v.son }))
      .sort((a, b) => b.adet - a.adet);
  } catch {
    return [];
  }
}

/**
 * Arac basina tik ozeti, coktan aza.
 * Iki depo da okunur ve toplanir: MySQL sonradan baglandiginda
 * once diske dusmus tikler raporda kaybolmasin.
 */
export async function tikOzeti(): Promise<{ satirlar: TikOzeti[]; kaynak: string }> {
  const birlesik = new Map<string, TikOzeti>();
  const kaynaklar: string[] = [];

  if (mysqlVarMi()) {
    try {
      const sonuc = (await query(
        `SELECT slug, COUNT(*) AS adet, MAX(clicked_at) AS son
           FROM outbound_clicks GROUP BY slug`
      )) as any[] | null;
      if (sonuc) {
        kaynaklar.push("mysql");
        for (const r of sonuc) {
          birlesik.set(r.slug, {
            slug: r.slug,
            adet: Number(r.adet),
            son: r.son ? new Date(r.son).toISOString() : null,
          });
        }
      }
    } catch {
      // Rapor MySQL'siz de uretilebilmeli.
    }
  }

  const diskten = disktenOku();
  if (diskten.length) kaynaklar.push("disk");
  for (const d of diskten) {
    const mevcut = birlesik.get(d.slug);
    if (mevcut) {
      mevcut.adet += d.adet;
      if (d.son && (!mevcut.son || d.son > mevcut.son)) mevcut.son = d.son;
    } else {
      birlesik.set(d.slug, d);
    }
  }

  return {
    satirlar: [...birlesik.values()].sort((a, b) => b.adet - a.adet),
    kaynak: kaynaklar.length ? kaynaklar.join(" + ") : "kayit yok",
  };
}
