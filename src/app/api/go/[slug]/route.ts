import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import toolsData from '@/data/tools.json';
import { query, ensureClicksTable } from '@/lib/db';
import { getClientIp } from '@/lib/rate-limit';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Affiliate outbound redirect + click tracker.
 *
 * GET /api/go/<tool-slug>
 *  - records the click (durable in MySQL when configured, otherwise a
 *    structured stdout log line that platform log drains/analytics can ingest)
 *  - 302-redirects to the tool's affiliate `websiteUrl`
 *  - never sends users to a dead/Google-search fallback: tools without a URL
 *    are bounced back to their own page instead of leaking a $0 click.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const tool = (toolsData as any[]).find((t) => t.slug === slug);

  if (!tool || !tool.websiteUrl) {
    const back = tool ? `/tools/${encodeURIComponent(slug)}` : '/';
    return NextResponse.redirect(new URL(back, request.url), 302);
  }

  // Best-effort click logging — must never block or break the redirect.
  try {
    const ip = getClientIp(request);
    const referer = (request.headers.get('referer') || '').slice(0, 500);
    const userAgent = (request.headers.get('user-agent') || '').slice(0, 500);

    const persisted = await ensureClicksTable();
    if (persisted) {
      await query(
        'INSERT INTO affiliate_clicks (tool_slug, ip, referer, user_agent) VALUES (?, ?, ?, ?)',
        [slug, ip, referer, userAgent]
      );
    } else {
      console.log(
        JSON.stringify({
          event: 'affiliate_click',
          slug,
          ip,
          referer,
          ts: new Date().toISOString(),
        })
      );
    }
  } catch (error) {
    console.error('Affiliate click logging failed:', error);
  }

  return NextResponse.redirect(tool.websiteUrl, 302);
}
