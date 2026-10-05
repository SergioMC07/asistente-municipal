// ============================================
// Acceso a Supabase por su API REST (sin SDK)
// ============================================
// Solo en el servidor y con la clave service_role: las tablas tienen RLS sin
// políticas, así que nadie más puede leerlas ni escribirlas.

export function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  return url && key ? { url, key } : null;
}

export async function supabase(
  cfg: { url: string; key: string },
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<Response> {
  const { prefer = 'return=representation', ...rest } = init;
  return fetch(`${cfg.url}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
      ...rest.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
}

export async function supabaseLista<T>(cfg: { url: string; key: string }, path: string): Promise<T[]> {
  const res = await supabase(cfg, path);
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return (await res.json()) as T[];
}
