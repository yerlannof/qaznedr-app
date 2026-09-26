import { permanentRedirect } from 'next/navigation';

export default function RootPage() {
  // Middleware normally handles this (including query preservation).
  // Keep the route itself server-only if rendered outside that entry point.
  permanentRedirect('/ru');
}
