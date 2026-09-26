import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';
import {
  rateLimit,
  createRateLimitResponse,
} from '@/lib/middleware/rate-limit';

const INDEXNOW_KEY = 'qaznedr2026indexnow';

export async function POST(request: NextRequest) {
  // Apply rate limiting (fails open when limiter env is absent)
  const rateLimitResult = await rateLimit(request);
  if (rateLimitResult && !rateLimitResult.success) {
    return createRateLimitResponse(
      rateLimitResult.limit,
      rateLimitResult.reset,
      rateLimitResult.remaining
    );
  }

  // Require admin OR a shared secret to prevent search-engine ping floods
  const admin = await requireAdmin();
  if (!admin) {
    const secret = process.env.INDEXNOW_TRIGGER_SECRET;
    const provided =
      request.headers.get('x-indexnow-secret') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!secret || provided !== secret) {
      return forbidden();
    }
  }

  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'urls array required' },
        { status: 400 }
      );
    }

    const payload = {
      host: 'qaznedr.kz',
      key: INDEXNOW_KEY,
      keyLocation: 'https://qaznedr.kz/qaznedr2026indexnow.txt',
      urlList: urls.map((url: string) =>
        url.startsWith('http') ? url : `https://qaznedr.kz${url}`
      ),
    };

    // Submit to IndexNow (Bing + Yandex)
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: true,
      status: response.status,
      submitted: urls.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    key: 'qaznedr2026indexnow',
    info: 'POST { urls: ["/ru/listings/123"] } to notify search engines of new/updated pages',
  });
}
