import type { Metadata } from 'next';

// Sign-in pages: never indexed (robots.txt only stops crawling, a known URL can still be indexed without a description).
// Pages may still set their own robots; this is the section default.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
