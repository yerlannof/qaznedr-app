import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import { updateProfile, ProfileType } from '@/lib/supabase/profiles';

export const dynamic = 'force-dynamic';

const VALID_PROFILE_TYPES: ProfileType[] = [
  'subsoil_user',
  'service_provider',
  'investor',
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profile_type } = body;

    if (!profile_type || !VALID_PROFILE_TYPES.includes(profile_type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid profile type. Must be one of: ${VALID_PROFILE_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const updatedProfile = await updateProfile(session.user.id, {
      profile_type,
    });

    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
