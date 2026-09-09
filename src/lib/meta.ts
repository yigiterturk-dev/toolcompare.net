import { fiyatDurumu, type Arac as FiyatArac } from "./fiyat.ts";

/**
 * Arama sonucunda aciklamanin kesilmedigi pratik ust sinir. Google piksel
 * olcer, karakter degil; 158 guvenli tarafta kalir.
 */
export const ACIKLAMA_UST_SINIR = 158;

type Arac = FiyatArac & {
  name: string;
  shortDescription?: string | null;
  verdict?: string | null;
  incelendi?: boolean;
};

/** Fiyat cumlesi yalnizca DOGRULANMIS bir fiyat varsa kurulur. */
function fiyatIfadesi(t: Arac): string | null {
  const d = fiyatDurumu(t);
  if (!d.kisa) return null;
  const belirsiz = /not verified|tbc/i.test(d.kisa);
  return belirsiz ? null : d.kisa;
}

function kirp(metin: string, sinir = ACIKLAMA_UST_SINIR): string {
  const tek = metin.replace(/\s+/g, " ").trim();
  if (tek.length <= sinir) return tek;
  const kesik = tek.slice(0, sinir - 1);
  const bosluk = kesik.lastIndexOf(" ");
  return `${(bosluk > 40 ? kesik.slice(0, bosluk) : kesik).replace(/[.,;:\s]+$/, "")}…`;
}

/**
 * Sayfa aciklamasi. Once bunun yerine tool.shortDescription tek basina
 * kullaniliyordu; katalogdaki 460 incelemenin 328'inde bu alan 60
 * karakterden kisa ("Universal database client.") oldugu icin arama
 * sonucunda satirin yarisi bos kaliyordu. Elimizde zaten dogrulanmis
 * fiyat ve yazilmis hukum var; aciklama bunlardan kuruluyor.
 */
export function metaAciklamasi(t: Arac): string {
  const kisa = (t.shortDescription ?? "").trim();
  const incelendi = Boolean(t.incelendi ?? t.verdict);

  if (!incelendi) {
    const bas = kisa || `${t.name}.`;
    return kirp(
      `${bas} What it costs to start and the closest alternatives we track — we have not published a full review of ${t.name} yet.`,
    );
  }

  const fiyat = fiyatIfadesi(t);
  const parcalar = [
    kisa || `${t.name} reviewed for 2026.`,
    fiyat ? `${fiyat}.` : null,
    (t.verdict ?? "").trim() || null,
  ].filter(Boolean) as string[];

  return kirp(parcalar.join(" "));
}
