// Comprobación rápida de la configuración en producción: /api/estado.
// Solo dice qué está conectado (sí o no), nunca muestra claves ni datos.

import { supabase, supabaseConfig } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function estadoSupabase(): Promise<string> {
  const cfg = supabaseConfig();
  if (!cfg) return 'Falta: añade SUPABASE_URL y SUPABASE_SERVICE_KEY en Vercel';
  try {
    const tablas = ['citas', 'bloqueos', 'conversaciones', 'mensajes', 'registros'];
    const respuestas = await Promise.all(tablas.map((t) => supabase(cfg, `${t}?select=*&limit=0`)));
    const fallo = respuestas.findIndex((r) => !r.ok);
    if (fallo === -1) return 'OK: conectado y con las 5 tablas';
    const r = respuestas[fallo];
    if (r.status === 401 || r.status === 403) return 'Error: la clave no es válida (usa la service_role)';
    if (r.status === 404) return `Error: falta la tabla «${tablas[fallo]}» (ejecuta citas.sql)`;
    return `Error ${r.status} al leer «${tablas[fallo]}»`;
  } catch {
    return 'Error: no se puede conectar (revisa SUPABASE_URL)';
  }
}

export async function GET() {
  const secreto = process.env.PANEL_SECRET;
  return Response.json(
    {
      supabase: await estadoSupabase(),
      email: process.env.RESEND_API_KEY && process.env.AVISOS_FROM ? 'OK' : 'Falta: RESEND_API_KEY y AVISOS_FROM',
      panel: secreto && secreto.length >= 32 ? 'OK' : 'Falta: PANEL_SECRET (32 caracteres o más)',
      asistente: process.env.OPENAI_API_KEY ? 'OK' : 'Falta: OPENAI_API_KEY',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
