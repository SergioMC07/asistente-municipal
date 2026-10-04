'use client';

import { useEffect, useRef, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

const URL_RE = /(https?:\/\/[^\s)]+)/g;

/** Pinta el texto respetando saltos de línea y convirtiendo URLs en enlaces. */
function RichText({ text }: { text: string }) {
  // Quita el formato de enlace markdown [texto](url) y deja solo la URL.
  const clean = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1: $2').replace(/\*\*/g, '');
  const parts = clean.split(URL_RE);
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function Chat({
  slug,
  nombre,
  sugerencias,
}: {
  slug: string;
  nombre: string;
  sugerencias: string[];
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `¡Hola! Soy el asistente del Ayuntamiento de ${nombre}. Pregúntame por horarios, trámites, servicios o fiestas, o cuéntame si quieres avisar de alguna incidencia.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    // El saludo inicial no se envía: solo existe en la pantalla.
    const history: Message[] = [...messages.slice(1), { role: 'user', content }];
    setMessages((prev) => [...prev, { role: 'user', content }, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    const setReply = (reply: string) =>
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: reply }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, messages: history }),
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setReply(data?.error ?? 'No he podido responder. Inténtalo de nuevo.');
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
      if (!reply) setReply('No he podido responder. Inténtalo de nuevo.');
    } catch {
      setReply('No hay conexión. Comprueba tu internet e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const showSuggestions = messages.length === 1 && sugerencias.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-municipal-brand px-4 py-2.5 text-white'
                  : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-municipal-line bg-white px-4 py-2.5 text-municipal-ink'
              }
            >
              {m.content ? (
                <RichText text={m.content} />
              ) : (
                <span className="text-municipal-muted">Escribiendo…</span>
              )}
            </div>
          </div>
        ))}

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-1">
            {sugerencias.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-municipal-brand/30 bg-municipal-soft px-3 py-1.5 text-sm text-municipal-brand-dark hover:bg-white"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-municipal-line bg-white px-3 py-3"
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
          className="min-w-0 flex-1 rounded-full border border-municipal-line px-4 py-2.5 text-base outline-none focus:border-municipal-brand"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-municipal-brand px-5 py-2.5 font-medium text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
