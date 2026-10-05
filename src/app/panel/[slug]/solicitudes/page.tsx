// Solicitudes («que me llamen», «quiero apuntarme») o incidencias, con su
// estado. Las pendientes primero: es la lista de tareas del día.

import Link from 'next/link';
import { ChatCircleText, Phone } from '@phosphor-icons/react/dist/ssr';
import { Hecho } from '@/components/panel/Hecho';
import { Cabecera, SinPanel, Vacio } from '@/components/panel/Piezas';
import { textos } from '@/lib/entidad';
import { almacen } from '@/lib/panel/acceso';
import type { Registro } from '@/lib/panel/datos';
import { cuando, hace30 } from '@/lib/panel/formato';
import { negocioDeSesion } from '@/lib/panel/sesion';

export const dynamic = 'force-dynamic';

function Tarjeta({ r, slug, solicitud }: { r: Registro; slug: string; solicitud: boolean }) {
  const hecho = r.estado === 'hecho';
  return (
    <li
      className={`rounded-[18px] border-[1.5px] bg-surface p-4 shadow-soft ${
        hecho ? 'border-line opacity-70' : 'border-line-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{r.tipo}</p>
          <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">{cuando(r.creado)}</p>
        </div>
        <Hecho api={`/api/panel/${slug}/registros/${r.id}`} hecho={hecho} />
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        {r.nombre && (
          <>
            <dt className="text-muted">Nombre</dt>
            <dd className="font-medium">{r.nombre}</dd>
          </>
        )}
        {r.lugar && (
          <>
            <dt className="text-muted">{solicitud ? 'Cuándo' : 'Lugar'}</dt>
            <dd>{r.lugar}</dd>
          </>
        )}
        {r.detalle && (
          <>
            <dt className="text-muted">Detalle</dt>
            <dd>{r.detalle}</dd>
          </>
        )}
      </dl>
      {(r.telefono || r.conversacion_id) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {r.telefono && (
            <a
              href={`tel:${r.telefono.replace(/\s/g, '')}`}
              className="press inline-flex items-center gap-1.5 rounded-full bg-cobalt px-3.5 py-2 text-sm font-semibold text-cobalt-on shadow-btn"
            >
              <Phone size={16} weight="bold" aria-hidden />
              <span className="font-mono tabular-nums">{r.telefono}</span>
            </a>
          )}
          {r.conversacion_id && (
            <Link
              href={`/panel/${slug}/c/${r.conversacion_id}`}
              className="press inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold shadow-btn"
            >
              <ChatCircleText size={16} weight="bold" aria-hidden />
              Ver conversación
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

export default async function Solicitudes({ params }: { params: { slug: string } }) {
  const acceso = await negocioDeSesion(params.slug);
  if (!acceso) return null;
  const t = textos(acceso.negocio);
  const solicitud = t.clase === 'solicitud';
  const titulo = solicitud ? 'Solicitudes' : 'Incidencias';
  const store = almacen(acceso);
  if (!store) return <SinPanel />;

  const registros = await store.registros(params.slug, hace30());
  const pendientes = registros.filter((r) => r.estado === 'pendiente');
  const hechos = registros.filter((r) => r.estado === 'hecho');

  return (
    <>
      <Cabecera
        titulo={titulo}
        texto={
          registros.length
            ? `${pendientes.length} ${pendientes.length === 1 ? 'pendiente' : 'pendientes'} de ${registros.length} en los últimos 30 días.`
            : undefined
        }
        excel={registros.length ? `/api/panel/${params.slug}/excel?tipo=registros` : undefined}
      />
      {registros.length === 0 ? (
        <Vacio titulo={solicitud ? 'Todavía no hay solicitudes' : 'Todavía no hay incidencias'}>
          {solicitud
            ? 'Cuando un cliente pida que le llaméis o quiera apuntarse, aparecerá aquí con su nombre y su teléfono.'
            : 'Cuando un vecino avise de una incidencia, aparecerá aquí con el lugar y el detalle.'}
        </Vacio>
      ) : (
        <div className="space-y-6">
          {pendientes.length > 0 && (
            <ul className="space-y-3">
              {pendientes.map((r) => (
                <Tarjeta key={r.id} r={r} slug={params.slug} solicitud={solicitud} />
              ))}
            </ul>
          )}
          {pendientes.length === 0 && (
            <p className="rounded-[18px] bg-cobalt-soft px-4 py-3 text-sm font-medium text-cobalt-text ring-1 ring-inset ring-line-strong">
              Todo al día: no queda ninguna pendiente.
            </p>
          )}
          {hechos.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted">Hechas</h2>
              <ul className="space-y-3">
                {hechos.map((r) => (
                  <Tarjeta key={r.id} r={r} slug={params.slug} solicitud={solicitud} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
