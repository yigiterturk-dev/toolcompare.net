/*
  BAKIM MODU TRIPWIRE — toolcompare.net + cryptoflowcheck.com

  Neden: 2026-09-14'te iki proje de bakim moduna alindi. Icerik uretimi durdu.
  Amac "acaba duzeldi mi" diye elle bakma refleksini oldurmek: ayda bir olcum
  alinir, ANLAMLI degisim yoksa SESSIZ kalir. Sessizlik = haber yok demek.

  Esik bilerek yuksek: gunluk tik >= 5 ya da ortalama sira 15'ten iyi.
  Gosterim artisi ESIK DEGIL -- 2026-09 olcumu gosterdi ki gosterim artiyor
  ama tik gelmiyor (14 gunde 21.534 gosterim / 10 tik / sira 56,4).
  Tiklanmayan gosterim haber degildir.
*/
import { getAccessToken, isoDay } from "../src/lib/gsc.ts";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const MULKLER = ["sc-domain:toolcompare.net", "sc-domain:cryptoflowcheck.com"];
const LOG = `${process.env.HOME}/Library/Logs/nocturn/bakim-tripwire.tsv`;
// Esikler env ile ezilebilir -- SEBEP: alarm yolunun kendisi test edilebilsin.
// Kurulmus ama hic denenmemis alarm, alarm degildir.
const TIK_ESIGI = Number(process.env.TRIPWIRE_TIK_ESIGI ?? 5);
const SIRA_ESIGI = Number(process.env.TRIPWIRE_SIRA_ESIGI ?? 15);

type Olcum = { mulk: string; gosterim: number; tik: number; sira: number; gunlukTik: number };

async function olc(token: string, mulk: string): Promise<Olcum | null> {
  const y = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(mulk)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: isoDay(30), endDate: isoDay(2), rowLimit: 1 }),
    },
  );
  const j: any = await y.json();
  const r = j.rows?.[0];
  if (!r) return null;
  return {
    mulk: mulk.replace("sc-domain:", ""),
    gosterim: r.impressions,
    tik: r.clicks,
    sira: r.position,
    gunlukTik: r.clicks / 28,
  };
}

async function telegram(mesaj: string): Promise<void> {
  // Sir buraya KOPYALANMIYOR: VPS'teki /usr/local/bin/bildir.sh token'i kendi
  // okur, biz yalnizca metni stdin'den veririz. bekci.sh ile ayni kaynak
  // (/root/jarvis/.env) -- token tek yerde kalsin diye.
  const { execFileSync } = await import("node:child_process");
  const kod = execFileSync("ssh", ["-o", "BatchMode=yes", "root@89.167.52.36", "bildir.sh"], {
    input: mesaj,
    encoding: "utf8",
  }).trim();
  if (kod !== "200") throw new Error(`Telegram gonderilemedi, HTTP ${kod}`);
}

const token = await getAccessToken();
const satirlar: Olcum[] = [];
for (const m of MULKLER) {
  const o = await olc(token, m);
  if (o) satirlar.push(o);
}

mkdirSync(dirname(LOG), { recursive: true });
const bugun = new Date().toISOString().slice(0, 10);
for (const o of satirlar) {
  appendFileSync(LOG, `${bugun}\t${o.mulk}\t${o.gosterim}\t${o.tik}\t${o.sira.toFixed(1)}\n`);
  console.log(`${o.mulk}\tgosterim ${o.gosterim}\ttik ${o.tik}\tsira ${o.sira.toFixed(1)}`);
}

const kipirdayan = satirlar.filter((o) => o.gunlukTik >= TIK_ESIGI || o.sira <= SIRA_ESIGI);
if (kipirdayan.length === 0) {
  console.log("esik asilmadi - sessiz kaliniyor");
} else {
  const mesaj =
    "TRIPWIRE: bakim modundaki bir site kipirdadi\n\n" +
    kipirdayan
      .map((o) => `${o.mulk}\n  28 gun: ${o.gosterim} gosterim / ${o.tik} tik / ort. sira ${o.sira.toFixed(1)}`)
      .join("\n") +
    "\n\nBu siteler 2026-09-14'te bakim moduna alinmisti. Yeniden bakmaya deger.";
  await telegram(mesaj);
  console.log("TELEGRAM GONDERILDI");
}
