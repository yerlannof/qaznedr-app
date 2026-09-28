import { ownProfileHandler } from '@/lib/auth/own-profile-http';

export const dynamic = 'force-dynamic';
export async function GET() {
  return ownProfileHandler('get')();
}
export async function PUT(request: Request) {
  return ownProfileHandler('update')(request);
}
