import { NextResponse } from 'next/server';
import { mineralGradients } from '@/components/features/placeholder-generator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const gradientType = type as keyof typeof mineralGradients;

  if (!mineralGradients[gradientType]) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const gradient = mineralGradients[gradientType];
  const width = 400;
  const height = 300;

  // Create SVG instead of canvas for server-side generation
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start}" />
          <stop offset="50%" style="stop-color:${gradient.end}" />
          <stop offset="100%" style="stop-color:${gradient.accent}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#gradient)" />
      ${Array.from({ length: 5 }, (_, _i) => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() * 100 + 50;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="${gradient.accent}" opacity="0.1" />`;
      }).join('')}
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
