'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ru';

  return (
    <div
      style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}
    >
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link
        href={`/${locale}`}
        style={{ color: '#0A84FF', textDecoration: 'underline' }}
      >
        Go to Home
      </Link>
    </div>
  );
}
