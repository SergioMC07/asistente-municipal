'use client';

import { ArrowRight, X } from '@phosphor-icons/react/dist/ssr';
import { useEffect } from 'react';
import { Hora } from '@/components/chat/Hora';
import { CitaCard } from '@/components/chat/CitaCard';
import { IncidenciaCard } from '@/components/chat/IncidenciaCard';
import type { Message } from '@/components/chat/useChat';
import type { Textos } from '@/lib/entidad';
import { extractCitas, extractIncidencias } from '@/lib/incidencia';

const REGISTROS = { incidencia: 'Incidencias', solicitud: 'Solicitudes' } as const;

/** Resumen de la conversación tal como lo vería el ayuntamiento o el negocio. */
export function PanelSummary({
  messages,
  clase = 'incidencia',
  ejemplo = '«Hay una farola fundida en la calle Mayor»',
  nombre = '',
}: {
  messages: Message[];
  clase?: Textos['clase'];
  ejemplo?: string;
  nombre?: string;
}) {
  const registros = REGISTROS[clase];
  const citas = messages
    .filter((m) => m.role === 'assistant' && !m.error)
    .flatMap((m) => extractCitas(m.content));
  const consultas = messages.filter((m) => m.role === 'user');
  const incidencias = messages
    .filter((m) => m.role === 'assistant' && !m.error)
    .flatMap((m) => extractIncidencias(m.content));

  return (
    <div className="space-y-7">
      <dl
        className={`grid gap-px overflow-hidden rounded-xl border border-line bg-line ${
          citas.length > 0 ? 'grid-cols-3' : 'grid-cols-2'
        }`}
      >
        <div className="bg-surface p-4">
          <dt className="text-sm text-muted">Consultas atendidas</dt>
          <dd className="mt-1 font-mono text-3xl font-semibold tabular-nums text-cobalt-text">
            {consultas.length}
          </dd>
        </div>
        {citas.length > 0 && (
          <div className="bg-surface p-4">
            <dt className="text-sm text-muted">Citas</dt>
            <dd className="mt-1 font-mono text-3xl font-semibold tabular-nums text-cobalt-text">{citas.length}</dd>
          </div>
        )}
        <div className="bg-surface p-4">
          <dt className="text-sm text-muted">{registros}</dt>
          <dd className="mt-1 font-mono text-3xl font-semibold tabular-nums text-cobalt-text">
            {incidencias.length}
          </dd>
        </div>
      </dl>

      <section>
        <h3 className="mb-3 font-semibold">Consultas</h3>
        {consultas.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay consultas. Pruebe a preguntar algo en el chat.</p>
        ) : (
          <ol className="space-y-2.5">
            {consultas.map((m, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <Hora at={m.at} className="shrink-0 text-muted" />
                <span>{m.content}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {citas.length > 0 && (
        <section>
          <h3 className="mb-3 font-semibold">Citas</h3>
          <div className="space-y-3">
            {citas.map((data) => (
              <CitaCard key={data.id + data.inicio} data={data} negocio={nombre} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 font-semibold">{registros}</h3>
        {incidencias.length === 0 ? (
          <p className="text-sm text-muted">Ninguna todavía. Pruebe con {ejemplo}.</p>
        ) : (
          <div className="space-y-3">
            {incidencias.map((data, i) => (
              <IncidenciaCard key={i} data={data} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const EXTRAS = {
  ayuntamiento: [
    'Informe mensual con los temas más consultados y las dudas sin respuesta.',
    'Incidencias con foto y ubicación, y aviso al responsable.',
    'El ayuntamiento edita la información que usa el asistente.',
    'El mismo asistente en WhatsApp y en la web municipal.',
  ],
  negocio: [
    'Cada solicitud llega al momento por email o WhatsApp, con el teléfono del cliente.',
    'Informe mensual con lo que más preguntan y las dudas sin respuesta.',
    'Tú editas los precios, horarios y ofertas que usa el asistente.',
    'El mismo asistente en WhatsApp y en su web.',
  ],
} as const;

export function Panel({
  slug,
  textos,
  messages,
  onClose,
  onReset,
}: {
  /** Para abrir el panel completo de demostración. */
  slug: string;
  textos: Textos;
  messages: Message[];
  onClose: () => void;
  onReset: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="backdrop-in fixed inset-0 z-20 flex justify-end bg-[oklch(0.17_0.02_258/0.45)]" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className="drawer-in flex h-full w-full max-w-md flex-col bg-canvas shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <div>
            <h2 id="panel-title" className="text-lg font-semibold">
              {textos.tipo === 'negocio' ? 'Tu panel' : 'Panel del ayuntamiento'}
            </h2>
            <p className="text-sm text-muted">
              Lo que vería {textos.titulo}, con los datos de esta conversación.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="press -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted [@media(hover:hover)]:hover:bg-sunken"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <PanelSummary
            messages={messages}
            clase={textos.clase}
            ejemplo={textos.ejemplo}
            nombre={textos.titulo}
          />

          <section className="mt-7 border-t border-line pt-5 text-sm">
            <h3 className="mb-2 font-semibold">En el servicio real, además</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-muted">
              {EXTRAS[textos.tipo].map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3">
          <a
            href={`/panel/demo/${slug}`}
            target="_blank"
            className="press inline-flex items-center gap-1.5 rounded-full bg-cobalt px-4 py-2 text-sm font-semibold text-cobalt-on shadow-btn"
          >
            Ver el panel completo
            <ArrowRight size={16} weight="bold" aria-hidden />
          </a>
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-muted underline [@media(hover:hover)]:hover:text-ink"
          >
            Empezar de nuevo
          </button>
        </div>
      </aside>
    </div>
  );
}
