import { equipmentHandler } from '@/lib/equipment-listings/http';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return equipmentHandler('queue')(request);
}
