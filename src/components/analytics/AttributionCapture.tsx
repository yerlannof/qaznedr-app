'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureAttribution } from '@/lib/analytics/attribution';

// Module state belongs to this browser document, including client-side layout remounts.
let referrerConsumed = false;

export default function AttributionCapture() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) {
      captureAttribution(
        pathname,
        window.location.search,
        referrerConsumed ? '' : document.referrer
      );
      referrerConsumed = true;
    }
  }, [pathname]);
  return null;
}
