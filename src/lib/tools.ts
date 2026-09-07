import fs from "fs";
import type { Arac } from "./arac";
import path from "path";
import { query, ensureTables } from "@/lib/db";

const toolsPath = path.join(process.cwd(), "src", "data", "tools.json");

/**
 * Arac listesi — once DB, olmazsa repodaki JSON.
 *
 * Bu mantik yalnizca /api/tools icindeydi ve anasayfa veriyi TARAYICIDAN
 * cekiyordu. Sonucu: sunucudan gelen HTML'de tek bir arac linki bile yoktu,
 * 121 urun sayfasinin tamami "orphan" (hicbir sayfadan linklenmiyor) idi.
 * Ayni yukleyiciyi sunucu bileseni de kullanabilsin diye buraya alindi.
 */
export async function getTools(): Promise<Arac[]> {
  try {
    await ensureTables();
    const dbTools = await query("SELECT * FROM tools ORDER BY created_at DESC");
    if (dbTools && Array.isArray(dbTools) && dbTools.length > 0) {
      /* DB satirlari; JSON alanlari metin olarak gelebiliyor. */
      return (dbTools as Record<string, unknown>[]).map((t) => ({
        ...(t as unknown as Arac),
        pros: typeof t.pros === "string" ? JSON.parse(t.pros) : t.pros,
        cons: typeof t.cons === "string" ? JSON.parse(t.cons) : t.cons,
        keyFeatures: typeof t.keyFeatures === "string" ? JSON.parse(t.keyFeatures) : t.keyFeatures,
      }));
    }
  } catch {
    // DB yoksa/dusukse sessizce dosyaya duseriz; sayfa yine dolu gelir.
  }
  try {
    return JSON.parse(fs.readFileSync(toolsPath, "utf8"));
  } catch {
    return [];
  }
}
