'use client';

import { X } from '@phosphor-icons/react/dist/ssr';
import { useEffect } from 'react';
import { Hora } from '@/components/chat/Hora';
import { IncidenciaCard } from '@/components/chat/IncidenciaCard';
import type { Message } from '@/components/chat/useChat';
import { extractIncidencias } from '@/lib/incidencia';

/** Resumen de la conversación tal como lo vería el ayuntamiento. */
export function PanelSummary({ messages }: { messages: Message[] }) {
  const consultas = messages.filter((m) => m.role === 'user');
  const incidencias = messages
    .filter((m) => m.role === 'assistant' && !m.error)
    .flatMap((m) => extractIncidencias(m.content));

  return (
    <div className="space-y-7">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
        <div className="bg-surface p-4">
          <dt className="text-sm text-muted">Consultas atendidas</dt>
          <dd className="mt-1 font-mono text-3xl font-semibold tabular-nums text-cobalt-text">
            {consultas.length}
          </dd>
        </div>
        <div className="bg-surface p-4">
          <dt className="text-sm text-muted">Incidencias</dt>
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

      <section>
        <h3 className="mb-3 font-semibold">Incidencias</h3>
        {incidencias.length === 0 ? (
          <p className="text-sm text-muted">
            Ninguna todavía. Pruebe con «Hay una farola fundida en la calle Mayor».
          </p>
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

export function Panel({
  nombre,
  messages,
  onClose,
  onReset,
}: {
  nombre: string;
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
              Panel del ayuntamiento
            </h2>
            <p className="text-sm text-muted">
              Lo que vería el Ayuntamiento de {nombre}, con los datos de esta conversación.
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
          <PanelSummary messages={messages} />

          <section className="mt-7 border-t border-line pt-5 text-sm">
            <h3 className="mb-2 font-semibold">En el servicio real, además</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-muted">
              <li>Informe mensual con los temas más consultados y las dudas sin respuesta.</li>
              <li>Incidencias con foto y ubicación, y aviso al responsable.</li>
              <li>El ayuntamiento edita la información que usa el asistente.</li>
              <li>El mismo asistente en WhatsApp y en la web municipal.</li>
            </ul>
          </section>
        </div>

        <div className="border-t border-line bg-surface px-5 py-3 text-right">
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
