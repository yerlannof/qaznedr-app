import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { createServiceClient } from '@/lib/supabase/server';
import {
  loadInquiryReport,
  parseInquiryReportPeriod,
} from '@/lib/inquiries/report';

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403, headers }
      );
    }
    const params = request.nextUrl.searchParams;
    const period = parseInquiryReportPeriod(
      params.get('from'),
      params.get('to')
    );
    if (!period) {
      return NextResponse.json(
        { success: false, error: 'Invalid report period' },
        { status: 400, headers }
      );
    }
    const data = await loadInquiryReport(await createServiceClient(), period);
    return NextResponse.json({ success: true, data }, { headers });
  } catch {
    // Never return a partial report or leak database/auth details.
    return NextResponse.json(
      {
        success: false,
        error:
          'Unable to complete report. Check access or try a narrower period.',
      },
      { status: 500, headers }
    );
  }
}
