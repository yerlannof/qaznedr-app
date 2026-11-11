import type { Metadata } from 'next';

// Admin tools: never indexed (robots.txt only stops crawling, a known URL can still be indexed without a description).
// Pages may still set their own robots; this is the section default.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
