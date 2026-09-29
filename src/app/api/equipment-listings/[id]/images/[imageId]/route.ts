import {
  imageHandler,
  type ImageContext,
} from '@/lib/equipment-listings/image-http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: ImageContext) {
  return imageHandler('read')(request, context);
}
