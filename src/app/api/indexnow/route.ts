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

  let body: { urls?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const urls = body?.urls;
  if (
    !Array.isArray(urls) ||
    urls.length === 0 ||
    urls.some((url) => typeof url !== 'string' || !url.trim())
  ) {
    return NextResponse.json({ error: 'urls array required' }, { status: 400 });
  }

  try {
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

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'IndexNow rejected submission',
          status: response.status,
          submitted: 0,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      submitted: urls.length,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to submit', submitted: 0 },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    key: 'qaznedr2026indexnow',
    info: 'POST { urls: ["/zh/leads"] } to notify search engines of new/updated pages. Accepted URLs are not guaranteed to be indexed.',
  });
}
