'use client';

import { ChartBar, WhatsappLogo, X } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import { Composer } from '@/components/chat/Composer';
import { Escudo } from '@/components/chat/Escudo';
import { Panel } from '@/components/chat/Panel';
import { Thread } from '@/components/chat/Thread';
import { useChat } from '@/components/chat/useChat';
import { demoWhatsappLink, startLink, type ContactConfig } from '@/lib/contact';

type Props = {
  slug: string;
  nombre: string;
  escudoUrl?: string;
  web: string;
  fecha: string;
  sugerencias: string[];
  contact: ContactConfig;
};

export function DemoApp({ slug, nombre, escudoUrl, web, fecha, sugerencias, contact }: Props) {
  const chat = useChat(slug, nombre);
  const [panelOpen, setPanelOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);

  const start = startLink(contact, nombre);
  const whatsapp = demoWhatsappLink(contact, nombre);

  return (
    <main className="mx-auto flex h-[100dvh] max-w-2xl flex-col bg-canvas sm:border-x sm:border-line">
      {bannerOpen && (
        <div className="flex items-center gap-3 bg-cobalt px-4 py-2 text-[13px] text-cobalt-on">
          <p className="min-w-0 flex-1 leading-snug">
            Demostración para el Ayuntamiento de {nombre}
            <span className="hidden sm:inline">. Pruébela como lo haría un vecino.</span>
          </p>
          {start && (
            <a
              href={start}
              target="_blank"
              rel="noopener noreferrer"
              className="press shrink-0 rounded-full bg-cobalt-on px-3 py-1 font-semibold text-[var(--cobalt)]"
            >
              Ponerlo en marcha
            </a>
          )}
          <button
            type="button"
            onClick={() => setBannerOpen(false)}
            aria-label="Ocultar aviso"
            className="press -mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-70"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Escudo nombre={nombre} url={escudoUrl} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-semibold leading-tight sm:text-base">
            Ayuntamiento de {nombre}
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok" aria-hidden />
            Asistente 24 horas
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="press flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-cobalt-text [@media(hover:hover)]:hover:bg-cobalt-soft"
        >
          <ChartBar size={16} weight="bold" aria-hidden />
          Panel
        </button>
      </header>

      <Thread
        className="flex-1"
        messages={chat.messages}
        loading={chat.loading}
        nombre={nombre}
        escudoUrl={escudoUrl}
        sugerencias={sugerencias}
        onSend={chat.send}
        onRetry={chat.retry}
      />

      <Composer onSend={chat.send} disabled={chat.loading} />

      <footer className="space-y-2 bg-surface px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 text-center text-xs text-muted">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-medium text-cobalt-text"
          >
            <WhatsappLogo size={16} weight="bold" aria-hidden />
            Probar en WhatsApp
          </a>
        )}
        <p>
          Asistente automático: puede equivocarse. Información de{' '}
          <a href={web} target="_blank" rel="noopener noreferrer" className="underline">
            la web municipal
          </a>{' '}
          ({fecha}). Emergencias: <strong className="text-ink">112</strong>.{' '}
          <a href="/privacidad" className="underline">
            Privacidad
          </a>
        </p>
      </footer>

      {panelOpen && (
        <Panel
          nombre={nombre}
          messages={chat.messages}
          onClose={() => setPanelOpen(false)}
          onReset={() => {
            chat.reset();
            setPanelOpen(false);
          }}
        />
      )}
    </main>
  );
}
