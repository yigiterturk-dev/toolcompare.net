import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!rateLimit(`chat:${ip}`, 15, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'AI assistant is not configured.' }, { status: 503 });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { message, tools } = await request.json();

    if (!message || typeof message !== 'string' || !Array.isArray(tools)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const systemPrompt = `You are the ToolCompare AI Expert. Your job is to help users find the best SaaS tools from our directory.
    
    Current Database Context (Sample):
    ${JSON.stringify(tools.map((t: any) => ({ name: t.name, category: t.category, short: t.shortDescription, price: t.basePrice })))}
    
    Instructions:
    1. Be professional, friendly, and expert.
    2. Recommend 2-3 specific tools from the context if they fit the user's request.
    3. If no exact match, recommend the closest category.
    4. Keep answers concise but helpful.
    5. Mention pricing if relevant.
    
    Answer in English.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for speed and cost
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
    });

    const reply = completion.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
