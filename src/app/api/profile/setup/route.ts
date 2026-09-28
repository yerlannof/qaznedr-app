import { ownProfileHandler } from '@/lib/auth/own-profile-http';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  return ownProfileHandler('setup')(request);
}
