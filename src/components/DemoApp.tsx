'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Escudo } from '@/components/Escudo';
import { IncidenciaCard } from '@/components/IncidenciaCard';
import { RichText } from '@/components/RichText';
import { demoWhatsappLink, startLink, type ContactConfig } from '@/lib/contact';
import { extractIncidencias, splitIncidencias } from '@/lib/incidencia';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  at: number;
  /** Mensaje de error del sistema: no se envía como historial. */
  error?: boolean;
};

type Props = {
  slug: string;
  nombre: string;
  escudoUrl?: string;
  web: string;
  fecha: string;
  sugerencias: string[];
  contact: ContactConfig;
};

const hora = (at: number) =>
  new Date(at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

function storageKey(slug: string) {
  return `asistente-municipal:${slug}`;
}

function loadMessages(slug: string): Message[] | null {
  try {
    const raw = sessionStorage.getItem(storageKey(slug));
    const parsed = raw ? (JSON.parse(raw) as Message[]) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveMessages(slug: string, messages: Message[]) {
  try {
    sessionStorage.setItem(storageKey(slug), JSON.stringify(messages));
  } catch {
    // Sin almacenamiento (modo privado): la demo funciona igual.
  }
}

function greeting(nombre: string): Message {
  return {
    role: 'assistant',
    content: `¡Hola! Soy el asistente del **Ayuntamiento de ${nombre}**. Te atiendo a cualquier hora.\n\nPregúntame por horarios, trámites, servicios o fiestas, o avísame de una incidencia en la calle.`,
    at: Date.now(),
  };
}

function Typing() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Escribiendo">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-bounce rounded-full bg-municipal-muted/60"
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
}: {
  message: Message;
  streaming: boolean;
  nombre: string;
  escudoUrl?: string;
  onRetry?: () => void;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-municipal-brand px-4 py-2.5 text-white shadow-sm">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <p className="mt-1 text-right text-[11px] text-white/70">{hora(message.at)}</p>
        </div>
      </div>
    );
  }

  const segments = splitIncidencias(message.content, streaming);
  return (
    <div className="flex items-end gap-2">
      <Escudo nombre={nombre} url={escudoUrl} size="sm" />
      <div className="max-w-[85%] space-y-2">
        <div
          className={`rounded-2xl rounded-bl-md border bg-white px-4 py-2.5 shadow-sm ${
            message.error ? 'border-red-200' : 'border-municipal-line'
          }`}
        >
          {segments.length === 0 ? (
            <Typing />
          ) : (
            <div className="space-y-2">
              {segments.map((s, i) =>
                s.kind === 'text' ? (
                  <RichText key={i} text={s.text} />
                ) : (
                  <IncidenciaCard key={i} data={s.data} />
                )
              )}
            </div>
          )}
          {!streaming && (
            <p className="mt-1 text-[11px] text-municipal-muted">{hora(message.at)}</p>
          )}
        </div>
        {message.error && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-medium text-municipal-brand underline underline-offset-2"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

function Panel({
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
  const consultas = messages.filter((m) => m.role === 'user');
  const incidencias = messages
    .filter((m) => m.role === 'assistant' && !m.error)
    .flatMap((m) => extractIncidencias(m.content));

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Vista del ayuntamiento"
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-municipal-line px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Vista del ayuntamiento</h2>
            <p className="text-sm text-municipal-muted">
              Lo que vería el Ayuntamiento de {nombre}, con los datos de esta conversación.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 text-2xl leading-none text-municipal-muted"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-municipal-soft p-4">
              <p className="text-3xl font-semibold text-municipal-brand-dark">{consultas.length}</p>
              <p className="text-sm text-municipal-muted">consultas atendidas</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-3xl font-semibold text-amber-700">{incidencias.length}</p>
              <p className="text-sm text-municipal-muted">incidencias registradas</p>
            </div>
          </div>

          <section>
            <h3 className="mb-2 font-semibold">Consultas</h3>
            {consultas.length === 0 ? (
              <p className="text-sm text-municipal-muted">Aún no hay consultas. Pruebe a preguntar algo.</p>
            ) : (
              <ul className="space-y-2">
                {consultas.map((m, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 font-mono text-municipal-muted">{hora(m.at)}</span>
                    <span>{m.content}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-semibold">Incidencias</h3>
            {incidencias.length === 0 ? (
              <p className="text-sm text-municipal-muted">
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

          <section className="rounded-xl border border-municipal-line p-4 text-sm">
            <h3 className="mb-2 font-semibold">En el servicio real, además</h3>
            <ul className="list-disc space-y-1 pl-5 text-municipal-muted">
              <li>Informe mensual: temas más consultados, horas de uso y dudas sin respuesta.</li>
              <li>Incidencias con foto y ubicación, y aviso automático al responsable.</li>
              <li>Edición de la información por el propio ayuntamiento.</li>
              <li>El mismo asistente en WhatsApp y en la web municipal.</li>
            </ul>
          </section>
        </div>

        <div className="border-t border-municipal-line px-5 py-3 text-right">
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-municipal-muted underline underline-offset-2"
          >
            Empezar de nuevo
          </button>
        </div>
      </aside>
    </div>
  );
}

export function DemoApp({ slug, nombre, escudoUrl, web, fecha, sugerencias, contact }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => [greeting(nombre)]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [restored, setRestored] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const start = startLink(contact, nombre);
  const whatsapp = demoWhatsappLink(contact, nombre);

  // Recupera la conversación al recargar (solo en el navegador).
  useEffect(() => {
    const saved = loadMessages(slug);
    if (saved) setMessages(saved);
    setRestored(true);
  }, [slug]);

  useEffect(() => {
    if (restored && !loading) saveMessages(slug, messages);
  }, [restored, loading, slug, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const used = useMemo(
    () => new Set(messages.filter((m) => m.role === 'user').map((m) => m.content)),
    [messages]
  );
  const pending = sugerencias.filter((s) => !used.has(s));

  const send = useCallback(
    async (text: string, base?: Message[]) => {
      const content = text.trim();
      if (!content || loading) return;

      const current = base ?? messages;
      const userMsg: Message = { role: 'user', content, at: Date.now() };
      // El saludo y los errores solo existen en la pantalla.
      const history = [...current.slice(1), userMsg]
        .filter((m) => !m.error)
        .map(({ role, content: c }) => ({ role, content: c }));

      setMessages([...current, userMsg, { role: 'assistant', content: '', at: Date.now() }]);
      setInput('');
      setLoading(true);

      const setReply = (reply: string, error = false) =>
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: reply, at: Date.now(), error },
        ]);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, messages: history }),
        });

        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setReply(data?.error ?? 'No he podido responder ahora mismo.', true);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let reply = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          reply += decoder.decode(value, { stream: true });
          setReply(reply);
        }
        if (!reply.trim()) setReply('No he podido responder ahora mismo.', true);
      } catch {
        setReply('No hay conexión. Comprueba tu internet.', true);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, slug]
  );

  function retry() {
    // Quita el error y el mensaje que lo provocó, y lo vuelve a enviar.
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    const idx = messages.lastIndexOf(lastUser);
    send(lastUser.content, messages.slice(0, idx));
  }

  function reset() {
    setMessages([greeting(nombre)]);
    setPanelOpen(false);
  }

  const showChips = !loading && pending.length > 0;
  const firstTurn = messages.length === 1;

  return (
    <main className="mx-auto flex h-[100dvh] max-w-2xl flex-col bg-municipal-paper sm:border-x sm:border-municipal-line">
      {bannerOpen && (
        <div className="flex items-center gap-2 bg-municipal-ink px-4 py-2 text-xs text-white sm:text-sm">
          <p className="min-w-0 flex-1 leading-snug">
            <span className="font-semibold">Demostración</span> para el Ayuntamiento de {nombre}
            <span className="hidden sm:inline">. Pruébela como lo haría un vecino</span>
          </p>
          {start && (
            <a
              href={start}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-white px-3 py-1 font-semibold text-municipal-ink"
            >
              Ponerlo en marcha
            </a>
          )}
          <button
            type="button"
            onClick={() => setBannerOpen(false)}
            className="shrink-0 px-1 text-lg leading-none text-white/70"
            aria-label="Ocultar aviso"
          >
            ×
          </button>
        </div>
      )}

      <header className="flex items-center gap-3 border-b border-municipal-line bg-white px-4 py-3">
        <Escudo nombre={nombre} url={escudoUrl} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-semibold leading-tight sm:text-base">Ayuntamiento de {nombre}</h1>
          <p className="flex items-center gap-1.5 truncate text-sm text-municipal-muted">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            Asistente 24 horas<span className="hidden sm:inline"> · responde al momento</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          aria-label="Vista del ayuntamiento"
          className="shrink-0 rounded-full border border-municipal-line px-3 py-1.5 text-sm font-medium text-municipal-brand-dark hover:bg-municipal-soft"
        >
          <span className="sm:hidden">Panel</span>
          <span className="hidden sm:inline">Vista del ayuntamiento</span>
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.map((m, i) => (
          <Bubble
            key={i}
            message={m}
            streaming={loading && i === messages.length - 1}
            nombre={nombre}
            escudoUrl={escudoUrl}
            onRetry={m.error && i === messages.length - 1 ? retry : undefined}
          />
        ))}

        {showChips && (
          <div className="pl-9">
            {!firstTurn && <p className="mb-2 text-xs text-municipal-muted">Otras preguntas</p>}
            <div className="flex flex-wrap gap-2">
              {(firstTurn ? pending : pending.slice(0, 2)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-municipal-brand/30 bg-white px-3 py-1.5 text-left text-sm text-municipal-brand-dark shadow-sm hover:bg-municipal-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-municipal-line bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
      >
        <label htmlFor="mensaje" className="sr-only">
          Escribe tu pregunta
        </label>
        <input
          id="mensaje"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="Escribe tu pregunta…"
          autoComplete="off"
          enterKeyHint="send"
          className="min-w-0 flex-1 rounded-full border border-municipal-line bg-municipal-paper px-4 py-2.5 text-base outline-none focus:border-municipal-brand focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-municipal-brand px-5 py-2.5 font-medium text-white transition-opacity disabled:opacity-40"
        >
          Enviar
        </button>
      </form>

      <footer className="bg-white px-4 pb-3 text-center text-xs text-municipal-muted">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 font-medium text-white"
          >
            Probar este asistente en WhatsApp
          </a>
        )}
        <p>
          Asistente automático: puede equivocarse. Información de{' '}
          <a href={web} target="_blank" rel="noopener noreferrer" className="underline">
            la web municipal
          </a>{' '}
          ({fecha}). Emergencias: <strong>112</strong>.
        </p>
      </footer>

      {panelOpen && (
        <Panel
          nombre={nombre}
          messages={messages}
          onClose={() => setPanelOpen(false)}
          onReset={reset}
        />
      )}
    </main>
  );
}
