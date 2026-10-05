'use client';

// Estado de una conversación con el asistente: envío en streaming,
// reintento, reinicio y conservación al recargar (sessionStorage).

import { useCallback, useEffect, useState } from 'react';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  at: number;
  /** Mensaje de error del sistema: se muestra pero no se envía como historial. */
  error?: boolean;
};

function greeting(saludo: string): Message {
  return { role: 'assistant', content: saludo, at: Date.now() };
}

function load(key: string): Message[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as Message[]) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function save(key: string, messages: Message[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // Sin almacenamiento (modo privado): todo funciona igual.
  }
}

function nuevoId(): string {
  const c: Crypto = crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  // Navegadores antiguos: UUID v4 con getRandomValues.
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Id de la conversación: se guarda con ella para que el panel la agrupe. */
function idConversacion(key: string, nueva = false): string {
  try {
    const guardado = nueva ? null : sessionStorage.getItem(`${key}:id`);
    if (guardado) return guardado;
    const id = nuevoId();
    sessionStorage.setItem(`${key}:id`, id);
    return id;
  } catch {
    return nuevoId();
  }
}

export function useChat(slug: string, saludo: string, storageKey = `atentia:${slug}`) {
  const [messages, setMessages] = useState<Message[]>(() => [greeting(saludo)]);
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const saved = load(storageKey);
    if (saved) setMessages(saved);
    setRestored(true);
  }, [storageKey]);

  useEffect(() => {
    if (restored && !loading) save(storageKey, messages);
  }, [restored, loading, storageKey, messages]);

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
          body: JSON.stringify({ slug, messages: history, conversacion: idConversacion(storageKey) }),
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
    [loading, messages, slug, storageKey]
  );

  const retry = useCallback(() => {
    // Quita el error y el mensaje que lo provocó, y lo vuelve a enviar.
    const idx = messages.map((m) => m.role).lastIndexOf('user');
    if (idx === -1) return;
    send(messages[idx].content, messages.slice(0, idx));
  }, [messages, send]);

  const reset = useCallback(() => {
    idConversacion(storageKey, true);
    setMessages([greeting(saludo)]);
  }, [saludo, storageKey]);

  return { messages, loading, send, retry, reset };
}
