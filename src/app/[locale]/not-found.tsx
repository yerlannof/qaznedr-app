import type { Metadata } from 'next';
import NotFoundContent from '@/components/layouts/NotFoundContent';

// Next adds <meta name="robots" content="noindex"> to every 404 by itself.
// Clearing the inherited robots keeps the [locale] layout's "index, follow"
// (or a section default) from appearing next to it as a second, contradicting
// tag.
export const metadata: Metadata = { robots: null };

export default function NotFound() {
  return <NotFoundContent />;
}
