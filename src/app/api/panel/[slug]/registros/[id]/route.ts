// Marca una solicitud o incidencia como hecha (o pendiente otra vez).

import { z } from 'zod';
import { panelStore } from '@/lib/panel/datos';
import { negocioDeSesion } from '@/lib/panel/sesion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { slug: string; id: string } }) {
  const acceso = await negocioDeSesion(params.slug);
  if (!acceso) return Response.json({ error: 'Sin acceso.' }, { status: 403 });
  // En la demostración el botón cambia en pantalla, pero no se guarda nada.
  if (acceso.demo) return Response.json({ ok: true, demo: true });
  const store = panelStore();
  if (!store) return Response.json({ error: 'Panel no activado.' }, { status: 409 });
  const parsed = z.object({ estado: z.enum(['pendiente', 'hecho']) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Datos no válidos.' }, { status: 400 });
  return Response.json({ ok: await store.marcarRegistro(params.slug, params.id, parsed.data.estado) });
}
