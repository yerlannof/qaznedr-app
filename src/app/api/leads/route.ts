import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware/rate-limiting';
import { listPublishedLeads } from '@/lib/leads/public-queries';

export const dynamic = 'force-dynamic';

// Public teaser list. Anon + RLS → only PUBLISHED rows, only teaser columns.
// limit hard-capped at 50 (no bulk dump). No private fields possible here.
async function handler(req: NextRequest): Promise<NextResponse> {
  const p = req.nextUrl.searchParams;
  const result = await listPublishedLeads({
    region: p.get('region') || undefined,
    tier: p.get('tier') || undefined,
    mineral: p.get('mineral') || undefined,
    exclusivity: p.get('exclusivity') || undefined,
    freeOnly: p.get('free') === '1',
    sort: (p.get('sort') as any) || 'newest',
    page: Number(p.get('page') || '1') || 1,
    limit: Math.min(Number(p.get('limit') || '24') || 24, 50),
  });
  return NextResponse.json({ success: true, data: result });
}

export const GET = withRateLimit(handler, 'search');
