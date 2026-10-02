import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import {
  loadInquiryReport,
  parseInquiryReportPeriod,
} from '../src/lib/inquiries/report';

async function main() {
  const args = process.argv.slice(2);
  const period =
    args.length === 2 ? parseInquiryReportPeriod(args[0], args[1]) : null;
  if (!period) {
    console.error(
      'Usage: npx tsx scripts/report-inquiries.ts YYYY-MM-DD YYYY-MM-DD\n' +
        'Inclusive calendar dates in Asia/Almaty; at most 366 days, through today.'
    );
    process.exitCode = 1;
    return;
  }

  loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing report environment');
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const report = await loadInquiryReport(client, period);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch(() => {
  console.error(
    'Report failed; no partial results returned. Check access and try a narrower period.'
  );
  process.exitCode = 1;
});
