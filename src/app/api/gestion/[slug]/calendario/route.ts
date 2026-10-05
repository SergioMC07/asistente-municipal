// Calendario del negocio (.ics) para suscribirse desde Google Calendar,
// Outlook o el iPhone. Se actualiza solo cada pocas horas (lo decide la app).

import { tokenValido } from '@/lib/citas/gestion';
import { ics } from '@/lib/citas/ics';
import { citasStore } from '@/lib/citas/store';
import { getPueblo } from '@/lib/pueblo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const pueblo = await getPueblo(params.slug);
  const token = new URL(req.url).searchParams.get('t');
  if (!pueblo || !tokenValido(pueblo, token)) return new Response('Enlace no válido.', { status: 403 });
  const store = citasStore();
  if (!store) return new Response('Agenda no activada.', { status: 409 });

  const desde = new Date(Date.now() - 30 * 86_400_000);
  const hasta = new Date(Date.now() + 120 * 86_400_000);
  const citas = await store.confirmadas(pueblo.slug, desde, hasta);
  const texto = ics(
    citas.map((c) => ({
      uid: c.id,
      inicio: c.inicio,
      fin: c.fin,
      titulo: `${c.tipo}: ${c.nombre}`,
      lugar: pueblo.citas?.lugar,
      descripcion: `Teléfono: ${c.telefono}${c.nota ? `\n${c.nota}` : ''}`,
    })),
    `Citas · ${pueblo.nombre}`
  );
  return new Response(texto, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
