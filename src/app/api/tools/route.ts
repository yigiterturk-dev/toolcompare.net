import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const toolsPath = path.join(process.cwd(), 'src', 'data', 'tools.json');

export async function GET() {
  try {
    const data = fs.readFileSync(toolsPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read tools data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tool, slug, password } = body;

    // Simple security check
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

    if (action === 'add') {
      tools.push(tool);
    } else if (action === 'delete') {
      tools = tools.filter((t: any) => t.slug !== slug);
    } else if (action === 'update') {
       const index = tools.findIndex((t: any) => t.slug === tool.slug);
       if (index !== -1) tools[index] = tool;
    }

    fs.writeFileSync(toolsPath, JSON.stringify(tools, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tools data' }, { status: 500 });
  }
}
