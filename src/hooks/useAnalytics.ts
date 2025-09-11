/**
 * React hook for analytics tracking
 */

import { useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { trackEvent, trackPageView, trackListingEvent, trackSearchEvent, trackAuthEvent, trackErrorEvent } from '@/lib/utils/analytics';
import { reportError } from '@/lib/utils/error-monitoring';

export function useAnalytics() {
  const { user } = useAuth();

  // Track a custom event
  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    trackEvent(event, {
      ...properties,
      userId: user?.id,
    });
  }, [user?.id]);

  // Track page view
  const trackPage = useCallback((name?: string, properties?: Record<string, unknown>) => {
    trackPageView(name, {
      ...properties,
      userId: user?.id,
    });
  }, [user?.id]);

  // Track listing interactions
  const trackListing = useCallback((action: string, listingId: string, listingType: string) => {
    trackListingEvent(action, listingId, listingType);
  }, []);

  // Track search interactions
  const trackSearch = useCallback((query: string, filters: Record<string, unknown>, resultsCount: number) => {
    trackSearchEvent(query, filters, resultsCount);
  }, []);

  // Track authentication events
  const trackAuth = useCallback((action: 'login' | 'register' | 'logout', method?: string) => {
    trackAuthEvent(action, method);
  }, []);

  // Track errors
  const trackError = useCallback((error: Error, context?: Record<string, unknown>) => {
    trackErrorEvent(error, {
      ...context,
      userId: user?.id,
    });
    
    // Also report to error monitoring
    reportError(error, {
      userId: user?.id,
      ...context,
    });
  }, [user?.id]);

  return {
    track,
    trackPage,
    trackListing,
    trackSearch,
    trackAuth,
    trackError,
  };
}