import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { yoneticiMi, hizFreni, istekKaynagi } from '@/lib/adminAuth';

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
    const { topic, password } = body;

    if (!hizFreni(`uret:${istekKaynagi(request)}`, 5)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!yoneticiMi(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load tools to provide context to the AI
    const toolsPath = path.join(process.cwd(), 'src/data/tools.json');
    const toolsData = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
    
    // Provide tools with slugs for internal linking
    const toolContext = toolsData.slice(0, 20).map((t: any) => `${t.name} (slug: ${t.slug})`).join(", ");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toolcompare.net";

    const prompt = `Write a high-end, expert-level blog post for a SaaS directory site.
    Topic: ${topic}
    
    The post should mention some of these tools if relevant: ${toolContext}.
    CRITICAL: When you mention a tool from the list above, you MUST link it using: <a href="/tools/slug-here" style="color: #6366f1; font-weight: bold; text-decoration: none;">Tool Name</a>. 
    Use the correct slug provided in the context.
    
    Format the response as a JSON object:
    {
      "title": "Stunning SEO Optimized Title",
      "slug": "optimized-slug-here",
      "excerpt": "A short, engaging 2-sentence summary for the card.",
      "content": "Full HTML content with <h2>, <p>, <strong> and <a> tags. Minimum 800 words. Use a professional, authoritative, and helpful tone. Wrap the content in a <div> with style='line-height: 1.8; font-size: 1.1rem;'.",
      "author": "TC Editorial",
      "date": "${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}",
      "readTime": "8 min read",
      "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200"
    }
    
    Return ONLY the JSON.`;

    const completion = await openaiAl().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from OpenAI");

    const newPost = JSON.parse(content);
    
    // Save to posts.json (create if not exists)
    const postsPath = path.join(process.cwd(), 'src/data/posts.json');
    let posts = [];
    if (fs.existsSync(postsPath)) {
      posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
    }
    
    posts.unshift(newPost);
    fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));

    return NextResponse.json({ success: true, post: newPost });
  } catch (error: any) {
    console.error("Blog Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
