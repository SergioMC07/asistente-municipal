'use client';

import { ArrowsOut } from '@phosphor-icons/react/dist/ssr';
import { Composer } from '@/components/chat/Composer';
import { Escudo } from '@/components/chat/Escudo';
import { Thread } from '@/components/chat/Thread';
import { useChat } from '@/components/chat/useChat';
import type { Textos } from '@/lib/entidad';

/** El producto funcionando en la portada: un chat real con un ejemplo ficticio. */
export function LandingDemo({
  slug,
  nombre,
  sugerencias,
  textos,
}: {
  slug: string;
  nombre: string;
  sugerencias: string[];
  textos: Textos;
}) {
  const chat = useChat(slug, textos.saludo, `atiende:landing:${slug}`);

  return (
    <div className="flex h-[min(600px,78dvh)] flex-col overflow-hidden rounded-[22px] border border-line bg-canvas shadow-soft">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Escudo nombre={nombre} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-tight">{textos.titulo}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            {textos.tipo === 'negocio'
              ? 'Negocio de ejemplo. Pregunta lo que quieras.'
              : 'Pueblo de ejemplo. Pregunte lo que quiera.'}
          </p>
        </div>
        <a
          href={`/${slug}`}
          aria-label="Abrir a pantalla completa"
          className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted [@media(hover:hover)]:hover:bg-sunken [@media(hover:hover)]:hover:text-ink"
        >
          <ArrowsOut size={18} aria-hidden />
        </a>
      </div>
      <Thread
        className="flex-1"
        messages={chat.messages}
        loading={chat.loading}
        nombre={nombre}
        sugerencias={sugerencias}
        onSend={chat.send}
        onRetry={chat.retry}
      />
      <Composer className="pb-3" onSend={chat.send} disabled={chat.loading} />
    </div>
  );
}
