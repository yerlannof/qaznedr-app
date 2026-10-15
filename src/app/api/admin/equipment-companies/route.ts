import { requireModerator } from '@/lib/auth/admin';
import {
  COMPANY_STATUSES,
  listCompanies,
  type CompanyStatus,
} from '@/lib/equipment-listings/companies';
import { publicReply } from '@/lib/equipment-listings/public-post';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (process.env.EQUIPMENT_MARKETPLACE_ENABLED !== 'true')
    return publicReply({ success: false }, 404);
  if (!(await requireModerator())) return publicReply({ success: false }, 403);
  const raw = new URL(request.url).searchParams.get('status') ?? 'PENDING';
  const status = (COMPANY_STATUSES as readonly string[]).includes(raw)
    ? (raw as CompanyStatus)
    : 'PENDING';
  try {
    return publicReply({ success: true, data: await listCompanies(status) });
  } catch {
    return publicReply({ success: false }, 503);
  }
}
