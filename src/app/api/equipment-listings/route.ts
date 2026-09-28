import { equipmentHandler } from '@/lib/equipment-listings/http';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return equipmentHandler('list')(request);
}
export async function POST(request: Request) {
  return equipmentHandler('create')(request);
}
