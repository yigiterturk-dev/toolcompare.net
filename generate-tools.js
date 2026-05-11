require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const toolsPath = path.join(__dirname, 'src', 'data', 'tools.json');

async function generateTools(category, count = 5) {
  console.log(`\n🔍 Yapay Zeka "${category}" kategorisinde en popüler ${count} adet aracı araştırıyor... Lütfen bekleyin.\n`);

    const prompt = `You are a world-class SaaS reviewer and SEO expert. Generate a JSON object containing a single key "tools", which is an array of ${count} real, popular SaaS tools in the "${category}" category.
Ensure the content is deep, professional, and optimized for search engine ranking (Programmatic SEO).

The schema for EACH tool MUST be:
{
  "slug": "tool-name-lowercase-with-hyphens",
  "name": "Exact Tool Name",
  "iconName": "One of: Zap, Cloud, BarChart3, Database, Activity, CheckCircle, Layout, Mail, Shield",
  "color1": "#hexcolor1",
  "color2": "#hexcolor2",
  "ease": integer 1-100,
  "featuresScore": integer 1-100,
  "category": "${category}",
  "basePrice": integer,
  "isFlat": boolean,
  "shortDescription": "One punchy sentence for the card view.",
  "longDescription": "A comprehensive 3-paragraph review analyzing the tool's market position, core strengths, and unique value proposition. Use professional English.",
  "keyFeatures": [
    { "title": "Feature Name", "description": "1-2 sentences explaining the benefit." },
    { "title": "Feature Name", "description": "1-2 sentences explaining the benefit." },
    { "title": "Feature Name", "description": "1-2 sentences explaining the benefit." }
  ],
  "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4"],
  "cons": ["Con 1", "Con 2"],
  "targetAudience": "Who is this best for? (e.g. Early-stage startups, Enterprise marketing teams, etc.)",
  "verdict": "Final expert verdict on whether the tool is worth the investment in 2026."
}
All text MUST be in English. Be specific, avoid generic AI fluff.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content);
    const newTools = data.tools;

    // Read existing tools
    let existingTools = [];
    if (fs.existsSync(toolsPath)) {
      existingTools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
    }

    // Filter out duplicates based on slug
    const existingSlugs = new Set(existingTools.map(t => t.slug));
    const addedTools = [];

    newTools.forEach(tool => {
      if (!existingSlugs.has(tool.slug)) {
        existingTools.push(tool);
        addedTools.push(tool);
      }
    });

    // Write back
    fs.writeFileSync(toolsPath, JSON.stringify(existingTools, null, 2));

    console.log(`✅ Başarılı! ${addedTools.length} adet yeni araç veritabanına eklendi.`);
    addedTools.forEach(t => console.log(`   - ${t.name}`));
    console.log(`\n🎉 Site sayfaları otomatik olarak oluşturuldu. Tarayıcıyı yenileyip görebilirsin!\n`);

  } catch (error) {
    console.error("❌ Bir hata oluştu:", error.message);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Kullanım: node generate-tools.js \"Kategori Adı\" [Araç Sayısı]");
  console.log("Örnek: node generate-tools.js \"E-ticaret\" 5");
  process.exit(1);
}

const category = args[0];
const count = args[1] ? parseInt(args[1]) : 5;

generateTools(category, count);
