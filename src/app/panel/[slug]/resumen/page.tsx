// Resumen de 30 días: cuánto trabaja el asistente, de qué le preguntan y qué
// no ha sabido responder (lo que conviene añadir a la ficha).

import Link from 'next/link';
import { Cabecera, SinPanel, Vacio } from '@/components/panel/Piezas';
import { citasStore } from '@/lib/citas/store';
import { textos } from '@/lib/entidad';
import { almacen } from '@/lib/panel/acceso';
import { cuando, hace30 } from '@/lib/panel/formato';
import { resumir } from '@/lib/panel/resumen';
import { negocioDeSesion } from '@/lib/panel/sesion';

export const dynamic = 'force-dynamic';

function Cifra({ valor, texto, detalle }: { valor: number; texto: string; detalle?: string }) {
  return (
    <div className="rounded-[18px] border-[1.5px] border-line-strong bg-surface p-4 shadow-soft">
      <p className="font-mono text-[2rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">{valor}</p>
      <p className="mt-2 text-sm font-medium">{texto}</p>
      {detalle && <p className="mt-0.5 text-xs text-muted">{detalle}</p>}
    </div>
  );
}

export default async function Resumen({ params }: { params: { slug: string } }) {
  const acceso = await negocioDeSesion(params.slug);
  if (!acceso) return null;
  const { negocio } = acceso;
  const t = textos(negocio);
  const store = almacen(acceso);
  if (!store) return <SinPanel />;

  const desde = hace30();
  const citas = !acceso.demo && negocio.citas?.modo === 'real' ? citasStore() : null;
  const [conversaciones, registros, citasMes] = await Promise.all([
    store.conversaciones(negocio.slug, desde, 1000),
    store.registros(negocio.slug, desde),
    citas ? citas.confirmadas(negocio.slug, desde, new Date(Date.now() + 120 * 86_400_000)) : Promise.resolve([]),
  ]);
  const citasAsistente = acceso.demo
    ? conversaciones.filter((c) => c.tiene_cita).length
    : citasMes.filter((c) => c.origen === 'asistente').length;
  const r = resumir(conversaciones, registros, citasAsistente, negocio.tipo);

  if (r.conversaciones === 0) {
    return (
      <>
        <Cabecera titulo="Resumen" />
        <Vacio titulo="Aún no hay datos">
          En cuanto tu asistente atienda las primeras conversaciones, aquí verás cuántas, de qué temas y qué no supo
          responder.
        </Vacio>
      </>
    );
  }

  const registrosTexto = t.clase === 'solicitud' ? 'Solicitudes' : 'Incidencias';
  const maxTema = Math.max(...r.temas.map((x) => x.total));

  return (
    <>
      <Cabecera titulo="Resumen" texto="Últimos 30 días." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cifra
          valor={r.conversaciones}
          texto="Conversaciones"
          detalle={r.porCanal.whatsapp ? `${r.porCanal.web} web · ${r.porCanal.whatsapp} WhatsApp` : undefined}
        />
        <Cifra valor={r.fueraDeHorario} texto="Fuera de horario" detalle="Noches y fines de semana" />
        {negocio.citas && <Cifra valor={r.citas} texto="Citas reservadas" detalle="Por el asistente" />}
        <Cifra
          valor={r.registros}
          texto={registrosTexto}
          detalle={r.pendientes ? `${r.pendientes} ${r.pendientes === 1 ? 'pendiente' : 'pendientes'}` : 'Todas hechas'}
        />
        {!negocio.citas && <Cifra valor={r.sinRespuesta} texto="Sin respuesta" />}
      </div>

      <section className="mt-6 rounded-[18px] border-[1.5px] border-line-strong bg-surface p-5 shadow-soft">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">De qué preguntan</h2>
        <ul className="mt-4 space-y-3">
          {r.temas.map((tema) => (
            <li key={tema.nombre}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{tema.nombre}</span>
                <span className="font-mono tabular-nums text-muted">{tema.total}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken" aria-hidden>
                <div className="h-full rounded-full bg-cobalt" style={{ width: `${(tema.total / maxTema) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-[18px] border-[1.5px] border-line-strong bg-surface p-5 shadow-soft">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">Lo que no supo responder</h2>
        {r.preguntasSinRespuesta.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Nada este mes: todas las preguntas tenían respuesta en tu información.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Mándanos la respuesta y la añadimos para que la próxima vez sí la sepa.
            </p>
            <ul className="mt-4 divide-y divide-line">
              {r.preguntasSinRespuesta.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/panel/${negocio.slug}/c/${p.id}`}
                    className="flex items-baseline justify-between gap-3 py-2.5 [@media(hover:hover)]:hover:text-cobalt-text"
                  >
                    <span className="min-w-0">«{p.pregunta}»</span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{cuando(p.cuando)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
