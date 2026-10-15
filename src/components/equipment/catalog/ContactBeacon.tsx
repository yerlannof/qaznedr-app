'use client';

import type { ReactNode } from 'react';

/** Counts taps on call / WhatsApp links (marked data-contact) for the author's stats. */
export default function ContactBeacon({
  listingId,
  children,
}: {
  listingId: string;
  children: ReactNode;
}) {
  return (
    <div
      onClickCapture={(event) => {
        if (!(event.target as Element).closest?.('a[data-contact]')) return;
        void fetch(`/api/equipment-catalog/${listingId}/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'contact' }),
          keepalive: true,
        }).catch(() => undefined);
      }}
    >
      {children}
    </div>
  );
}
