export default function NotFound() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <a href="/" style={{ color: '#0A84FF', textDecoration: 'underline' }}>
        Go to Home
      </a>
    </div>
  );
}