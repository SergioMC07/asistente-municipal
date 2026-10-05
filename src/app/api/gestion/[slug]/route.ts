// Acciones del negocio sobre su agenda: cancelar, apuntar, bloquear y desbloquear.

import { z } from 'zod';
import { madridAUtc } from '@/lib/citas/agenda';
import { tokenValido } from '@/lib/citas/gestion';
import { reservar } from '@/lib/citas/servicio';
import { citasStore } from '@/lib/citas/store';
import { negocioDeSesion } from '@/lib/panel/sesion';
import { getPueblo } from '@/lib/pueblo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hora = z.string().regex(/^\d{2}:\d{2}$/);

const accionSchema = z.discriminatedUnion('accion', [
  z.object({ accion: z.literal('cancelar'), id: z.string().min(1).max(64) }),
  z.object({
    accion: z.literal('apuntar'),
    fecha,
    hora,
    nombre: z.string().min(2).max(80),
    telefono: z.string().min(9).max(20),
    nota: z.string().max(300).optional(),
  }),
  z.object({ accion: z.literal('bloquear'), fecha, desde: hora, hasta: hora, motivo: z.string().max(120).optional() }),
  z.object({ accion: z.literal('desbloquear'), id: z.string().min(1).max(64) }),
]);

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const pueblo = await getPueblo(params.slug);
  const token = new URL(req.url).searchParams.get('t');
  // Con el enlace secreto de gestión o con la sesión del panel.
  const sesion = pueblo && !tokenValido(pueblo, token) ? await negocioDeSesion(pueblo.slug) : null;
  if (!pueblo || !(tokenValido(pueblo, token) || sesion)) {
    return Response.json({ error: 'Enlace no válido.' }, { status: 403 });
  }
  if (sesion?.demo) {
    return Response.json({ error: 'Es una demostración: los cambios no se guardan.' }, { status: 409 });
  }
  const store = citasStore();
  if (!store || pueblo.citas?.modo !== 'real') {
    return Response.json({ error: 'Esta agenda no está activada.' }, { status: 409 });
  }

  const parsed = accionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Datos no válidos.' }, { status: 400 });
  const a = parsed.data;

  if (a.accion === 'cancelar') {
    return Response.json({ ok: await store.cancelar(pueblo.slug, a.id) });
  }
  if (a.accion === 'desbloquear') {
    return Response.json({ ok: await store.desbloquear(pueblo.slug, a.id) });
  }
  if (a.accion === 'bloquear') {
    if (a.hasta <= a.desde) return Response.json({ error: 'La hora final debe ser posterior.' }, { status: 400 });
    const b = await store.bloquear({
      slug: pueblo.slug,
      inicio: madridAUtc(a.fecha, a.desde).toISOString(),
      fin: madridAUtc(a.fecha, a.hasta).toISOString(),
      motivo: a.motivo || null,
    });
    return Response.json({ ok: true, bloqueo: b });
  }
  // Cita apuntada por el propio negocio: ocupa el hueco y no genera aviso.
  const r = await reservar(pueblo, a, new Date(), store, 'manual');
  return r.ok ? Response.json({ ok: true, cita: r.cita }) : Response.json({ error: r.error }, { status: 409 });
}
