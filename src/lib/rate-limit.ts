// ============================================
// Límite de mensajes por IP (en memoria)
// ============================================
// Suficiente para demos: en serverless cada instancia lleva su cuenta, así que
// el límite real es algo más alto. Para producción, mover a Supabase o Redis.

type Bucket = { count: number; resetAt: number };

export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();

  return function check(key: string, now = Date.now()): boolean {
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      // Limpieza perezosa para que el mapa no crezca sin fin.
      if (buckets.size > 5_000) {
        for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      }
      return true;
    }
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  };
}
