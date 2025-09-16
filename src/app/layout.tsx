import { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QAZNEDR.KZ - Kazakhstan Mining Platform',
  description:
    'Platform for buying and selling mineral deposits and licenses in Kazakhstan',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
