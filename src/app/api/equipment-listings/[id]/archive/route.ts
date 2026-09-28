import {
  equipmentHandler,
  type ItemContext,
} from '@/lib/equipment-listings/http';

export const dynamic = 'force-dynamic';
export async function POST(request: Request, context: ItemContext) {
  return equipmentHandler('archive')(request, context);
}
