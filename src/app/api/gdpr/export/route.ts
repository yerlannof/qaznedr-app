import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/middleware/rate-limit';

/**
 * GDPR Data Export Endpoint
 * Allows users to export all their personal data
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request);
  if (rateLimitResult && !rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Collect all user data
    const userData: any = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      metadata: user.user_metadata,
      
      // Get user's listings
      listings: [],
      favorites: [],
      messages: [],
      searchHistory: [],
    };

    // Fetch user's listings
    const { data: listings } = await supabase
      .from('kazakhstan_deposits')
      .select('*')
      .eq('user_id', user.id);
    
    if (listings) {
      userData.listings = listings.map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        type: l.type,
        mineral: l.mineral,
        price: l.price,
        region: l.region,
        city: l.city,
        createdAt: l.created_at,
        updatedAt: l.updated_at,
        status: l.status,
        views: l.views,
      }));
    }

    // Fetch user's favorites
    const { data: favorites } = await supabase
      .from('favorites')
      .select('*, kazakhstan_deposits!inner(*)')
      .eq('user_id', user.id);
    
    if (favorites) {
      userData.favorites = favorites.map(f => ({
        listingId: f.listing_id,
        listingTitle: f.kazakhstan_deposits?.title,
        addedAt: f.created_at,
      }));
    }

    // Fetch user's messages (if messaging system exists)
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
    
    if (messages) {
      userData.messages = messages.map(m => ({
        id: m.id,
        content: m.sender_id === user.id ? m.content : '[Received message]',
        sentAt: m.created_at,
        isIncoming: m.sender_id !== user.id,
      }));
    }

    // Log data export for compliance
    console.log(`GDPR data export requested by user ${user.id} at ${new Date().toISOString()}`);

    // Return data as JSON (could also be CSV or other format)
    return NextResponse.json(userData, {
      headers: {
        'Content-Disposition': `attachment; filename="user-data-${user.id}-${Date.now()}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}