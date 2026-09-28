import {
  equipmentHandler,
  type ItemContext,
} from '@/lib/equipment-listings/http';

export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: ItemContext) {
  return equipmentHandler('detail')(request, context);
}
export async function PATCH(request: Request, context: ItemContext) {
  return equipmentHandler('edit')(request, context);
}
