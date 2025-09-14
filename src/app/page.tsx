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
            <li><a href="/debug">Debug Page</a></li>
            <li><a href="/ru">Russian Version (currently disabled)</a></li>
            <li><a href="/en">English Version (currently disabled)</a></li>
          </ul>
        </div>
      </body>
    </html>
  );
}