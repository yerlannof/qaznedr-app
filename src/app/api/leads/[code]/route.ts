import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware/rate-limiting';
import { getPublishedLeadByCode } from '@/lib/leads/public-queries';

export const dynamic = 'force-dynamic';

// Single teaser (used for OG/sitemap helpers). Teaser columns only. 404 on unknown.
async function handler(req: NextRequest): Promise<NextResponse> {
  const parts = req.nextUrl.pathname.split('/');
  const code = parts[parts.indexOf('leads') + 1];
  const lead = await getPublishedLeadByCode(code);
  if (!lead) {
    return NextResponse.json(
      { success: false, error: 'Not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: lead });
}

export const GET = withRateLimit(handler, 'search');
