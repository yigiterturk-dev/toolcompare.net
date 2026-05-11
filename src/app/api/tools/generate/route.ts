import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const toolsPath = path.join(process.cwd(), 'src', 'data', 'tools.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, count, password } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prompt = `You are a world-class SaaS reviewer and SEO expert. Generate a JSON object containing a single key "tools", which is an array of ${count || 5} real, popular SaaS tools in the "${category}" category.
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
      "shortDescription": "One punchy sentence.",
      "longDescription": "3-paragraph comprehensive review in English.",
      "keyFeatures": [
        { "title": "Feature Name", "description": "1-2 sentences." },
        { "title": "Feature Name", "description": "1-2 sentences." },
        { "title": "Feature Name", "description": "1-2 sentences." }
      ],
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2"],
      "targetAudience": "Target audience description in English.",
      "verdict": "Final verdict in English."
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content || '{}');
    const newTools = data.tools || [];

    // Read and Update JSON
    const existingTools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
    const existingSlugs = new Set(existingTools.map((t: any) => t.slug));
    
    const added = [];
    for (const tool of newTools) {
      if (!existingSlugs.has(tool.slug)) {
        existingTools.push(tool);
        added.push(tool);
      }
    }

    fs.writeFileSync(toolsPath, JSON.stringify(existingTools, null, 2));

    return NextResponse.json({ success: true, addedCount: added.length, tools: added });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
