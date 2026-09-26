import { notFound } from 'next/navigation';

// Unknown paths under a locale render [locale]/not-found in the page's
// language instead of Next's bare English default 404.
export default function UnknownPage(): never {
  notFound();
}
