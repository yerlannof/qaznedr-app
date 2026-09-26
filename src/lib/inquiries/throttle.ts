// Best-effort in-memory limiter. Per serverless instance only — Upstash is not
// configured in production, so this plus the honeypot is the spam guard.
export function createThrottle({
  limit,
  windowMs,
  maxKeys = 5000,
  now = () => Date.now(),
}: {
  limit: number;
  windowMs: number;
  /** Memory bound. Expired keys go first, then the least recently used. */
  maxKeys?: number;
  now?: () => number;
}): (key: string) => boolean {
  // Map order = last activity, oldest first (keys are re-inserted on use).
  const hits = new Map<string, number[]>();

  function prune(t: number): void {
    for (const [key, stamps] of hits) {
      if (stamps.every((ts) => t - ts >= windowMs)) hits.delete(key);
    }
    for (const key of hits.keys()) {
      if (hits.size <= maxKeys) break;
      hits.delete(key);
    }
  }

  return function allow(key: string): boolean {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
    const allowed = recent.length < limit;
    if (allowed) recent.push(t);
    hits.delete(key);
    hits.set(key, recent);
    if (hits.size > maxKeys) prune(t);
    return allowed;
  };
}
