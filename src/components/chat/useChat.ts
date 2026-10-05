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

export function useChat(slug: string, saludo: string, storageKey = `atiende:${slug}`) {
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

  const retry = useCallback(() => {
    // Quita el error y el mensaje que lo provocó, y lo vuelve a enviar.
    const idx = messages.map((m) => m.role).lastIndexOf('user');
    if (idx === -1) return;
    send(messages[idx].content, messages.slice(0, idx));
  }, [messages, send]);

  const reset = useCallback(() => setMessages([greeting(saludo)]), [saludo]);

  return { messages, loading, send, retry, reset };
}
