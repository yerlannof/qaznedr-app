import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Registration stays closed until the unified identity flow is ready.
 * The legacy Prisma registration and first-user admin bootstrap are retired.
 * Existing NextAuth sign-in is unchanged; the equipment pilot cannot reopen this.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    { success: false, error: 'Registration is not available' },
    {
      status: 404,
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    }
  );
}
