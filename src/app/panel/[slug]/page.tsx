// Bandeja de conversaciones: lo que ha preguntado cada cliente, con señales
// para ver de un vistazo cuáles acabaron en cita, solicitud o sin respuesta.

import Link from 'next/link';
import { ChatCircleText, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';
import { Cabecera, Senal, SinPanel, Vacio } from '@/components/panel/Piezas';
import { textos } from '@/lib/entidad';
import { panelStore, type Conversacion } from '@/lib/panel/datos';
import { cuando, hace30 } from '@/lib/panel/formato';
import { negocioDeSesion } from '@/lib/panel/sesion';

export const dynamic = 'force-dynamic';

const FILTROS = {
  todas: { texto: 'Todas', cumple: () => true },
  cita: { texto: 'Con cita', cumple: (c: Conversacion) => c.tiene_cita },
  registro: { texto: 'Con solicitud', cumple: (c: Conversacion) => c.tiene_registro },
  'sin-respuesta': { texto: 'Sin respuesta', cumple: (c: Conversacion) => c.sin_respuesta },
} as const;

type Filtro = keyof typeof FILTROS;

export default async function Conversaciones({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { f?: string };
}) {
  const acceso = await negocioDeSesion(params.slug);
  if (!acceso) return null;
  const t = textos(acceso.negocio);
  const store = panelStore();
  if (!store) return <SinPanel />;

  const todas = await store.conversaciones(params.slug, hace30());
  const filtro: Filtro = searchParams.f && searchParams.f in FILTROS ? (searchParams.f as Filtro) : 'todas';
  const lista = todas.filter(FILTROS[filtro].cumple);
  const etiquetaRegistro = t.clase === 'solicitud' ? 'Solicitud' : 'Incidencia';
  const base = `/panel/${params.slug}`;

  return (
    <>
      <Cabecera
        titulo="Conversaciones"
        texto={`${todas.length} en los últimos 30 días. Se borran solas pasado ese plazo.`}
        excel={todas.length ? `/api/panel/${params.slug}/excel?tipo=conversaciones` : undefined}
      />

      {todas.length > 0 && (
        <div className="-mx-4 mb-4 overflow-x-auto px-4">
          <div className="flex gap-2">
            {(Object.keys(FILTROS) as Filtro[]).map((f) => {
              const n = todas.filter(FILTROS[f].cumple).length;
              const activo = f === filtro;
              const texto = f === 'registro' ? `Con ${etiquetaRegistro.toLowerCase()}` : FILTROS[f].texto;
              return (
                <Link
                  key={f}
                  href={f === 'todas' ? base : `${base}?f=${f}`}
                  aria-current={activo ? 'true' : undefined}
                  className={`press shrink-0 rounded-full border-[1.5px] px-3.5 py-1.5 text-sm font-medium shadow-btn ${
                    activo ? 'border-cobalt bg-cobalt text-cobalt-on' : 'border-line-strong bg-surface text-ink'
                  }`}
                >
                  {texto} <span className="font-mono tabular-nums opacity-75">{n}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {todas.length === 0 ? (
        <Vacio titulo="Todavía no hay conversaciones">
          Cuando alguien escriba a tu asistente, la verás aquí al momento con lo que preguntó y cómo acabó.
        </Vacio>
      ) : lista.length === 0 ? (
        <Vacio titulo="Ninguna con este filtro">Prueba con «Todas» para ver el resto.</Vacio>
      ) : (
        <ul className="overflow-hidden rounded-[18px] border-[1.5px] border-line-strong bg-surface shadow-soft">
          {lista.map((c) => {
            const Canal = c.canal === 'whatsapp' ? WhatsappLogo : ChatCircleText;
            return (
              <li key={c.id} className="border-b border-line last:border-b-0">
                <Link
                  href={`${base}/c/${c.id}`}
                  className="flex gap-3 px-4 py-3.5 transition-colors duration-150 [@media(hover:hover)]:hover:bg-sunken/60"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cobalt-soft text-cobalt-text">
                    <Canal size={18} weight="bold" aria-label={c.canal === 'whatsapp' ? 'WhatsApp' : 'Web'} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-semibold">{c.nombre ?? c.cliente ?? c.primera ?? c.ultima ?? 'Conversación'}</span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{cuando(c.actualizada)}</span>
                    </span>
                    {(c.nombre || c.cliente) && c.primera && (
                      <span className="block truncate text-sm text-ink">{c.primera}</span>
                    )}
                    {c.ultima && c.ultima !== c.primera && (
                      <span className="block truncate text-sm text-muted">Último: {c.ultima}</span>
                    )}
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {c.tiene_cita && <Senal tipo="cita" />}
                      {c.tiene_registro && <Senal tipo="registro" texto={etiquetaRegistro} />}
                      {c.sin_respuesta && <Senal tipo="sin" />}
                      <span className="text-xs text-muted">
                        {Math.ceil(c.mensajes / 2)} {Math.ceil(c.mensajes / 2) === 1 ? 'pregunta' : 'preguntas'}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
