import { Metadata } from 'next';

// Gated full package — never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LeadFullLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
