import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { query, ensureTables } from '@/lib/db';
import { checkAdminPassword } from '@/lib/auth';

const toolsPath = path.join(process.cwd(), 'src', 'data', 'tools.json');

export async function GET() {
  try {
    // 1. Try DB first
    await ensureTables();
    const dbTools = await query('SELECT * FROM tools ORDER BY created_at DESC');
    
    if (dbTools && Array.isArray(dbTools)) {
      // Parse JSON fields
      const parsedTools = dbTools.map((t: any) => ({
        ...t,
        pros: typeof t.pros === 'string' ? JSON.parse(t.pros) : t.pros,
        cons: typeof t.cons === 'string' ? JSON.parse(t.cons) : t.cons,
        keyFeatures: typeof t.keyFeatures === 'string' ? JSON.parse(t.keyFeatures) : t.keyFeatures
      }));
      return NextResponse.json(parsedTools);
    }

    // 2. Fallback to JSON
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

    if (!checkAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Try DB Action
    const dbSuccess = await ensureTables();
    if (dbSuccess) {
      if (action === 'add') {
        await query(`
          INSERT INTO tools (slug, name, category, iconName, color1, color2, ease, featuresScore, basePrice, isFlat, websiteUrl, shortDescription, longDescription, targetAudience, verdict, pros, cons, keyFeatures)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [tool.slug, tool.name, tool.category, tool.iconName, tool.color1, tool.color2, tool.ease, tool.featuresScore, tool.basePrice, tool.isFlat, tool.websiteUrl, tool.shortDescription, tool.longDescription, tool.targetAudience, tool.verdict, JSON.stringify(tool.pros), JSON.stringify(tool.cons), JSON.stringify(tool.keyFeatures)]);
      } else if (action === 'delete') {
        await query('DELETE FROM tools WHERE slug = ?', [slug]);
      } else if (action === 'update') {
        await query(`
          UPDATE tools SET name=?, category=?, iconName=?, color1=?, color2=?, ease=?, featuresScore=?, basePrice=?, isFlat=?, websiteUrl=?, shortDescription=?, longDescription=?, targetAudience=?, verdict=?, pros=?, cons=?, keyFeatures=?
          WHERE slug = ?
        `, [tool.name, tool.category, tool.iconName, tool.color1, tool.color2, tool.ease, tool.featuresScore, tool.basePrice, tool.isFlat, tool.websiteUrl, tool.shortDescription, tool.longDescription, tool.targetAudience, tool.verdict, JSON.stringify(tool.pros), JSON.stringify(tool.cons), JSON.stringify(tool.keyFeatures), tool.slug]);
      }
      return NextResponse.json({ success: true, source: 'database' });
    }

    // Bundled source files are read-only/ephemeral on serverless production.
    // Require the database instead of reporting a write that will disappear.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Persistent database is not configured.' },
        { status: 503 }
      );
    }

    // 2. Fallback to JSON Action (Local Dev only)
    let tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
    if (action === 'add') tools.push(tool);
    else if (action === 'delete') tools = tools.filter((t: any) => t.slug !== slug);
    else if (action === 'update') {
       const index = tools.findIndex((t: any) => t.slug === tool.slug);
       if (index !== -1) tools[index] = tool;
    }
    fs.writeFileSync(toolsPath, JSON.stringify(tools, null, 2));
    
    return NextResponse.json({ success: true, source: 'file' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tools data' }, { status: 500 });
  }
}
