import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message, tools } = await request.json();

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
