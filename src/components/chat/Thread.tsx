'use client';

import { ArrowClockwise } from '@phosphor-icons/react/dist/ssr';
import { useEffect, useMemo, useRef } from 'react';
import { RichText } from '@/components/RichText';
import { Escudo } from '@/components/chat/Escudo';
import { Hora } from '@/components/chat/Hora';
import { CitaCard } from '@/components/chat/CitaCard';
import { IncidenciaCard } from '@/components/chat/IncidenciaCard';
import type { Message } from '@/components/chat/useChat';
import { splitIncidencias } from '@/lib/incidencia';

function Typing() {
  return (
    <span className="flex h-6 items-center gap-1" role="status" aria-label="Escribiendo">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="typing-dot h-1.5 w-1.5 rounded-full bg-muted"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

function Bubble({
  message,
  streaming,
  nombre,
  escudoUrl,
  onRetry,
  real,
}: {
  message: Message;
  streaming: boolean;
  nombre: string;
  escudoUrl?: string;
  onRetry?: () => void;
  real?: boolean;
}) {
  if (message.role === 'user') {
    return (
      <div className="msg-in flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-br-md border border-cobalt-strong bg-cobalt px-4 py-2.5 text-cobalt-on">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <p className="mt-1 text-right text-[11px] opacity-75">
            <Hora at={message.at} />
          </p>
        </div>
      </div>
    );
  }

  const segments = splitIncidencias(message.content, streaming);
  return (
    <div className="msg-in flex items-end gap-2">
      <Escudo nombre={nombre} url={escudoUrl} size="sm" />
      <div className="min-w-0 max-w-[85%] space-y-2">
        <div
          className={`rounded-2xl rounded-bl-md border bg-surface px-4 py-2.5 shadow-soft ${
            // Borde visible y tintado con el color de la demo (cobalto o el de la marca).
            message.error ? 'border-danger' : 'border-line-strong'
          }`}
        >
          {segments.length === 0 ? (
            <Typing />
          ) : (
            <div className="space-y-2.5 leading-relaxed">
              {segments.map((s, i) =>
                s.kind === 'text' ? (
                  <RichText key={i} text={s.text} />
                ) : s.kind === 'cita' ? (
                  <CitaCard key={i} data={s.data} negocio={nombre} />
                ) : (
                  <IncidenciaCard key={i} data={s.data} real={real} />
                )
              )}
            </div>
          )}
          {!streaming && (
            <p className="mt-1 text-[11px] text-muted">
              <Hora at={message.at} />
            </p>
          )}
        </div>
        {message.error && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="press inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-surface px-3 py-1.5 text-sm font-medium text-cobalt-text shadow-btn"
          >
            <ArrowClockwise size={16} weight="bold" aria-hidden />
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export function Thread({
  messages,
  loading,
  nombre,
  escudoUrl,
  sugerencias,
  onSend,
  onRetry,
  className = '',
  chipsClassName = '',
  real = false,
}: {
  messages: Message[];
  loading: boolean;
  nombre: string;
  escudoUrl?: string;
  sugerencias: string[];
  onSend: (text: string) => void;
  onRetry: () => void;
  className?: string;
  /** Clases para las preguntas sugeridas (p. ej. ocultarlas si ya están en la ficha lateral). */
  chipsClassName?: string;
  /** Cliente real: las tarjetas no llevan la nota de demostración. */
  real?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Solo se desplaza el propio hilo: en la landing la página no debe moverse.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const used = useMemo(
    () => new Set(messages.filter((m) => m.role === 'user').map((m) => m.content)),
    [messages]
  );
  const pending = sugerencias.filter((s) => !used.has(s));
  const firstTurn = messages.length === 1;
  const chips = firstTurn ? pending : pending.slice(0, 2);

  return (
    <div
      ref={scrollRef}
      className={`space-y-4 overflow-y-auto px-4 py-5 ${className}`}
      aria-live="polite"
      aria-busy={loading}
    >
      {messages.map((m, i) => (
        <Bubble
          key={i}
          message={m}
          streaming={loading && i === messages.length - 1}
          nombre={nombre}
          escudoUrl={escudoUrl}
          onRetry={m.error && i === messages.length - 1 ? onRetry : undefined}
          real={real}
        />
      ))}

      {!loading && chips.length > 0 && (
        <div className={`pl-9 ${chipsClassName}`}>
          {!firstTurn && <p className="mb-2 text-xs text-muted">Otras preguntas</p>}
          <div className="flex flex-wrap gap-2">
            {chips.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSend(s)}
                className="press rounded-full border-[1.5px] border-line-strong bg-surface px-3.5 py-1.5 text-left text-sm font-medium text-ink shadow-btn transition-colors duration-150 [@media(hover:hover)]:hover:border-cobalt [@media(hover:hover)]:hover:text-cobalt-text"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
