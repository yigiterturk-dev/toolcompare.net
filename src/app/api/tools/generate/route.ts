import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { yoneticiMi, hizFreni, istekKaynagi } from '@/lib/adminAuth';
import { guvenliYaz } from '@/lib/dosya';

/**
 * Istemci TEMBEL kuruluyor.
 *
 * Onceden modul seviyesindeydi: `next build` sayfa verisini toplarken bu
 * modulu calistiriyor ve OPENAI_API_KEY yoksa BUILD PATLIYORDU. Yani
 * anahtar env'den bir gun duserse deploy da duserdi -- oysa bu uc,
 * anahtar olmadan sadece hata donmeliydi, tum siteyi dusurmemeliydi.
 */
let _openai: OpenAI | null = null;
function openaiAl(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, count = 1, password } = body;

    if (!hizFreni(`uret:${istekKaynagi(request)}`, 5)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!yoneticiMi(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load existing tools to prevent duplicates
    const filePath = path.join(process.cwd(), 'src/data/tools.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const existingTools = JSON.parse(fileData);
    const existingSlugs = new Set(existingTools.map((t: any) => t.slug));

    const prompt = `Generate ${count} highly professional, deep-dive reviews for unique SaaS tools in the "${category}" category. 
    DO NOT generate tools that are likely already in a standard directory (like Slack or Zoom) unless they are elite niche players.
    
    Format the response as a JSON object with a "tools" key containing an array of objects:
    {
      "tools": [
        {
          "name": "Proper Tool Name",
          "category": "${category}",
          "shortDescription": "A punchy, one-sentence value proposition.",
          "longDescription": "EXACTLY THREE (3) long, professional paragraphs. Minimum 300 words total.",
          "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4"],
          "cons": ["Con 1", "Con 2"],
          "keyFeatures": [
            { "title": "Feature 1", "description": "Detailed explanation." },
            { "title": "Feature 2", "description": "..." },
            { "title": "Feature 3", "description": "..." },
            { "title": "Feature 4", "description": "..." }
          ],
          "targetAudience": "Detailed description.",
          "verdict": "Expert opinion.",
          "basePrice": 29,
          "isFlat": false,
          "ease": 90,
          "featuresScore": 90,
          "color1": "#3b82f6",
          "color2": "#1d4ed8",
          "iconName": "Zap"
        }
      ]
    }
    
    Ensure each tool is unique and the content is ELITE professional English.`;

    const completion = await openaiAl().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from OpenAI");

    const parsed = JSON.parse(content);
    const generatedTools = parsed.tools || [];
    let addedCount = 0;

    generatedTools.forEach((newTool: any) => {
      newTool.slug = (newTool.name || "").toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      
      // Duplicate Check
      if (!existingSlugs.has(newTool.slug)) {
        // KAPI: satici linki olmayan arac KAYDEDILMEZ.
        // Bu ucun urettigi alti kayit (PayMaster Pro, VidSmart Pro,
        // EditFlow Elite, ClipForge X, SceneCraft, MetaMotion Studio)
        // gercekte var olmayan urunlerdi ve hepsinin ortak isareti
        // linksiz olmalariydi. Var olmayan urunu inceleyen bir
        // karsilastirma sitesinin baska hicbir iddiasina guvenilmez.
        if (!newTool?.websiteUrl || !/^https:\/\/[^\s]+\.[^\s]+/.test(newTool.websiteUrl)) {
          return NextResponse.json(
            { error: `Rejected "${newTool?.name ?? 'unnamed'}": a tool must have a real https:// website URL. If the model cannot name one, the tool probably does not exist.` },
            { status: 422 }
          );
        }

        existingTools.push(newTool);
        existingSlugs.add(newTool.slug);
        addedCount++;
      }
    });

    guvenliYaz(filePath, JSON.stringify(existingTools, null, 2));

    return NextResponse.json({ success: true, addedCount, totalFound: generatedTools.length });
  } catch (error: unknown) {
    console.error("Generation Error:", error);
    /*
      HAM HATA MESAJI ISTEMCIYE DONUYORDU: saglayici hatalari altyapi
      ayrintisi (model adi, kota, anahtar durumu) sizdirir. Ayni bulgu
      /api/chat icin daha once duzeltilmisti, bu iki rotada kalmis.
      Ayrinti sunucu gunlugune, istemciye genel mesaj.
    */
    return NextResponse.json({ error: "Tool generation failed" }, { status: 500 });
  }
}
