// Descarga en Excel de las citas, las solicitudes o incidencias, o las conversaciones.

import { citasStore } from '@/lib/citas/store';
import { panelStore } from '@/lib/panel/datos';
import { csv, fechaHora } from '@/lib/panel/excel';
import { negocioDeSesion } from '@/lib/panel/sesion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const acceso = await negocioDeSesion(params.slug);
  if (!acceso) return new Response('Sin acceso.', { status: 403 });
  const tipo = new URL(req.url).searchParams.get('tipo');
  const hace30 = new Date(Date.now() - 30 * 86_400_000);
  let texto: string;

  if (tipo === 'citas') {
    const store = citasStore();
    const hasta = new Date(Date.now() + 120 * 86_400_000);
    const citas = store ? await store.confirmadas(params.slug, hace30, hasta) : [];
    texto = csv(
      ['Fecha', 'Hora', 'Nombre', 'Teléfono', 'Motivo', 'Nota', 'Origen'],
      citas.map((c) => [
        ...fechaHora(c.inicio),
        c.nombre,
        c.telefono,
        c.tipo,
        c.nota,
        c.origen === 'manual' ? 'Apuntada por el negocio' : 'Asistente',
      ])
    );
  } else if (tipo === 'registros') {
    const store = panelStore();
    const registros = store ? await store.registros(params.slug, hace30) : [];
    texto = csv(
      ['Fecha', 'Hora', 'Tipo', 'Qué', 'Dónde o cuándo', 'Detalle', 'Nombre', 'Teléfono', 'Estado'],
      registros.map((r) => [
        ...fechaHora(r.creado),
        r.clase === 'solicitud' ? 'Solicitud' : 'Incidencia',
        r.tipo,
        r.lugar,
        r.detalle,
        r.nombre,
        r.telefono,
        r.estado === 'hecho' ? 'Hecho' : 'Pendiente',
      ])
    );
  } else if (tipo === 'conversaciones') {
    const store = panelStore();
    const lista = store ? await store.conversaciones(params.slug, hace30, 1000) : [];
    texto = csv(
      ['Fecha', 'Hora', 'Canal', 'Primera pregunta', 'Mensajes', 'Cita', 'Solicitud o incidencia', 'Sin respuesta'],
      lista.map((c) => [
        ...fechaHora(c.creada),
        c.canal === 'whatsapp' ? 'WhatsApp' : 'Web',
        c.primera,
        c.mensajes,
        c.tiene_cita ? 'Sí' : '',
        c.tiene_registro ? 'Sí' : '',
        c.sin_respuesta ? 'Sí' : '',
      ])
    );
  } else {
    return new Response('Tipo no válido.', { status: 400 });
  }

  return new Response(texto, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${params.slug}-${tipo}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
