import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { sanitizeMiningInput } from '@/lib/middleware/input-sanitization';

/**
 * GDPR Consent Management Endpoint
 * Manages user consent preferences for data processing
 */

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  personalizedContent: boolean;
  thirdPartySharing: boolean;
  newsletterSubscription: boolean;
}

/**
 * GET - Retrieve current consent preferences
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

    // Get user's consent preferences
    const { data: consent } = await supabase
      .from('user_consent')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!consent) {
      // Return default preferences if not set
      return NextResponse.json({
        userId: user.id,
        preferences: {
          analytics: false,
          marketing: false,
          personalizedContent: true,
          thirdPartySharing: false,
          newsletterSubscription: false,
        },
        lastUpdated: null,
        ipAddress: null,
      });
    }

    return NextResponse.json({
      userId: user.id,
      preferences: {
        analytics: consent.analytics_consent,
        marketing: consent.marketing_consent,
        personalizedContent: consent.personalized_content_consent,
        thirdPartySharing: consent.third_party_sharing_consent,
        newsletterSubscription: consent.newsletter_consent,
      },
      lastUpdated: consent.updated_at,
      ipAddress: consent.ip_address,
      consentVersion: consent.consent_version,
    });
  } catch (error) {
    console.error('GDPR consent retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve consent preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST - Update consent preferences
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const sanitizedBody = sanitizeMiningInput(body);
    const preferences = sanitizedBody.preferences as ConsentPreferences;

    if (!preferences) {
      return NextResponse.json(
        { error: 'Consent preferences required' },
        { status: 400 }
      );
    }

    // Get IP address for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') ||
                      'unknown';

    // Prepare consent record
    const consentRecord = {
      user_id: user.id,
      analytics_consent: preferences.analytics || false,
      marketing_consent: preferences.marketing || false,
      personalized_content_consent: preferences.personalizedContent || false,
      third_party_sharing_consent: preferences.thirdPartySharing || false,
      newsletter_consent: preferences.newsletterSubscription || false,
      ip_address: ipAddress,
      user_agent: request.headers.get('user-agent') || 'unknown',
      consent_version: '1.0',
      updated_at: new Date().toISOString(),
    };

    // Upsert consent preferences
    const { data: updatedConsent, error: upsertError } = await supabase
      .from('user_consent')
      .upsert(consentRecord, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    // Create audit log entry
    await supabase
      .from('consent_audit_log')
      .insert([{
        user_id: user.id,
        action: 'consent_updated',
        preferences: JSON.stringify(preferences),
        ip_address: ipAddress,
        timestamp: new Date().toISOString(),
      }]);

    // Update user's cookie preferences
    const response = NextResponse.json({
      message: 'Consent preferences updated successfully',
      preferences,
      updatedAt: new Date().toISOString(),
    });

    // Set consent cookie for client-side tracking
    response.cookies.set('gdpr_consent', JSON.stringify({
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      version: '1.0',
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('GDPR consent update error:', error);
    return NextResponse.json(
      { error: 'Failed to update consent preferences' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Withdraw all consent
 */
export async function DELETE(request: NextRequest) {
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

    // Set all consent to false (withdraw consent)
    const withdrawnConsent = {
      user_id: user.id,
      analytics_consent: false,
      marketing_consent: false,
      personalized_content_consent: false,
      third_party_sharing_consent: false,
      newsletter_consent: false,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      consent_version: '1.0',
      updated_at: new Date().toISOString(),
    };

    // Update consent record
    await supabase
      .from('user_consent')
      .upsert(withdrawnConsent, {
        onConflict: 'user_id',
      });

    // Create audit log entry
    await supabase
      .from('consent_audit_log')
      .insert([{
        user_id: user.id,
        action: 'consent_withdrawn',
        preferences: JSON.stringify({
          analytics: false,
          marketing: false,
          personalizedContent: false,
          thirdPartySharing: false,
          newsletterSubscription: false,
        }),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        timestamp: new Date().toISOString(),
      }]);

    // Clear consent cookie
    const response = NextResponse.json({
      message: 'All consent withdrawn successfully',
      withdrawnAt: new Date().toISOString(),
    });

    response.cookies.delete('gdpr_consent');

    return response;
  } catch (error) {
    console.error('GDPR consent withdrawal error:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw consent' },
      { status: 500 }
    );
  }
}