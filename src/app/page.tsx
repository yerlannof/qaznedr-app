import Link from 'next/link';

export default function RootPage() {
  return (
    <html>
      <body>
        <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
          <h1>QAZNEDR.KZ - Working!</h1>
          <p>The site is now functional without i18n.</p>
          <p>Next step: Re-enable i18n with proper configuration.</p>
          <br />
          <h2>Test Links:</h2>
          <ul>
            <li>
              <Link href="/debug">Debug Page</Link>
            </li>
            <li>
              <Link href="/ru">Russian Version (currently disabled)</Link>
            </li>
            <li>
              <Link href="/en">English Version (currently disabled)</Link>
            </li>
          </ul>
        </div>
      </body>
    </html>
  );
}