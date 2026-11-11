'use client';

import { useEffect } from 'react';

const KEY = 'qaznedr:equipment-viewed:';

/** True when this tab session already counted the listing; marks it otherwise. */
function seenThisSession(listingId: string): boolean {
  try {
    if (sessionStorage.getItem(KEY + listingId)) return true;
    sessionStorage.setItem(KEY + listingId, '1');
  } catch {
    // Storage blocked: count the visit rather than lose it.
  }
  return false;
}

/**
 * Counts one view per listing per browser session for the author's stats.
 * Automated browsers (navigator.webdriver) are skipped; the server still
 * drops bot user agents.
 */
export default function ViewBeacon({ listingId }: { listingId: string }) {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;
    if (seenThisSession(listingId)) return;
    try {
      void fetch(`/api/equipment-catalog/${listingId}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'view' }),
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // Stats must never affect the page.
    }
  }, [listingId]);
  return null;
}
