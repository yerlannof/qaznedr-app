// Best-effort in-memory limiter. Per serverless instance only — Upstash is not
// configured in production, so this plus the honeypot is the spam guard.
export function createThrottle({
  limit,
  windowMs,
  now = () => Date.now(),
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): (key: string) => boolean {
  const hits = new Map<string, number[]>();
  return function allow(key: string): boolean {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear(); // bound memory on long-lived instances
    return true;
  };
}
