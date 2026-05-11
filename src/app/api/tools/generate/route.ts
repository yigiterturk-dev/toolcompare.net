import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, toolName, password } = body;

    if (password !== "toolpass99") { // Basic protection for now
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prompt = `Generate a highly professional, deep-dive review for a SaaS tool named "${toolName || category}". 
    The content MUST be elite-level, human-like, and authoritative. 

    Format the response as a JSON object with these EXACT keys:
    {
      "name": "Proper Tool Name",
      "category": "${category || 'SaaS'}",
      "shortDescription": "A punchy, one-sentence value proposition.",
      "longDescription": "EXACTLY THREE (3) long, professional paragraphs. Paragraph 1: Introduction and core philosophy. Paragraph 2: Key strengths and scaling capabilities. Paragraph 3: Trade-offs, ecosystem, and final recommendation. Total length should be at least 300 words.",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2"],
      "keyFeatures": [
        { "title": "Feature 1 Title", "description": "A detailed explanation of why this feature matters." },
        { "title": "Feature 2 Title", "description": "..." },
        { "title": "Feature 3 Title", "description": "..." }
      ],
      "targetAudience": "A specific description of who should use this and why.",
      "verdict": "A powerful, one-sentence final expert opinion.",
      "basePrice": 29,
      "isFlat": false,
      "ease": 90,
      "featuresScore": 90,
      "color1": "#3b82f6",
      "color2": "#1d4ed8",
      "iconName": "Zap"
    }
    
    Return ONLY the JSON object.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from OpenAI");

    const newTool = JSON.parse(content);
    newTool.slug = (newTool.name || "").toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // Save to tools.json
    const filePath = path.join(process.cwd(), 'src/data/tools.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const tools = JSON.parse(fileData);
    
    // Check if exists, update or add
    const index = tools.findIndex((t: any) => t.slug === newTool.slug);
    if (index !== -1) {
      tools[index] = { ...tools[index], ...newTool };
    } else {
      tools.push(newTool);
    }

    fs.writeFileSync(filePath, JSON.stringify(tools, null, 2));

    return NextResponse.json({ success: true, tool: newTool });
  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
