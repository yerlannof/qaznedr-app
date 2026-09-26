import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware/rate-limiting';
import {
  listPublishedLeads,
  type LeadListResult,
} from '@/lib/leads/public-queries';

export const dynamic = 'force-dynamic';

// Simple in-process TTL cache. Leads data is near-static; this avoids hitting
// Supabase on every request within a serverless instance's lifetime.
const TTL_MS = 60_000;
const responseCache = new Map<string, { ts: number; value: LeadListResult }>();

function getCachedResponse(key: string): LeadListResult | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.value;
}

// Public teaser list. Anon + RLS → only PUBLISHED rows, only teaser columns.
// limit hard-capped at 50 (no bulk dump). No private fields possible here.
async function handler(req: NextRequest): Promise<NextResponse> {
  const p = req.nextUrl.searchParams;

  const cacheKey = p.toString();
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached });
  }

  // A transient database failure must not become a cached empty catalogue.
  let result: LeadListResult;
  try {
    result = await listPublishedLeads({
      region: p.get('region') || undefined,
      tier: p.get('tier') || undefined,
      mineral: p.get('mineral') || undefined,
      exclusivity: p.get('exclusivity') || undefined,
      freeOnly: p.get('free') === '1',
      sort:
        (p.get('sort') as 'newest' | 'value_desc' | 'confidence_desc') ||
        'newest',
      page: Number(p.get('page') || '1') || 1,
      limit: Math.min(Number(p.get('limit') || '24') || 24, 50),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to load areas' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  responseCache.set(cacheKey, { ts: Date.now(), value: result });
  return NextResponse.json({ success: true, data: result });
}

export const GET = withRateLimit(handler, 'search');
