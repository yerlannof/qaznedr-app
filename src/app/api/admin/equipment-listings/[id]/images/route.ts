import {
  imageHandler,
  type ImagesContext,
} from '@/lib/equipment-listings/image-http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: ImagesContext) {
  return imageHandler('admin-list')(request, context);
}
