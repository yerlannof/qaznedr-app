import {
  imageHandler,
  type ImagesContext,
} from '@/lib/equipment-listings/image-http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: ImagesContext) {
  return imageHandler('list')(request, context);
}

export async function POST(request: Request, context: ImagesContext) {
  return imageHandler('upload')(request, context);
}

export async function PUT(request: Request, context: ImagesContext) {
  return imageHandler('reorder')(request, context);
}
