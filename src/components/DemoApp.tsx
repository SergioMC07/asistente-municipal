'use client';

import { ChartBar, Clock, Globe, Phone, WhatsappLogo, X } from '@phosphor-icons/react/dist/ssr';
import { useMemo, useState, type ReactNode } from 'react';
import { Composer } from '@/components/chat/Composer';
import { Escudo } from '@/components/chat/Escudo';
import { Panel } from '@/components/chat/Panel';
import { Thread } from '@/components/chat/Thread';
import { useChat } from '@/components/chat/useChat';
import { demoWhatsappLink, startLink, type ContactConfig } from '@/lib/contact';
import type { Textos } from '@/lib/entidad';
import { extractIncidencias } from '@/lib/incidencia';
import { marcaStyle } from '@/lib/marca';

type Props = {
  slug: string;
  nombre: string;
  /** "Autoescuela en Valencia" o "Asistente 24 horas para vecinos y visitantes". */
  subtitulo: string;
  escudoUrl?: string;
  color?: string;
  telefono?: string;
  horario?: string;
  web: string;
  fecha: string;
  sugerencias: string[];
  contact: ContactConfig;
  textos: Textos;
};

function Dato({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="mt-0.5 shrink-0 text-cobalt-text">
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0 leading-snug">{children}</dd>
    </div>
  );
}

export function DemoApp(props: Props) {
  const { slug, nombre, subtitulo, escudoUrl, color, telefono, horario, web, fecha, sugerencias, contact, textos } =
    props;
  const chat = useChat(slug, textos.saludo);
  const negocio = textos.tipo === 'negocio';
  const [panelOpen, setPanelOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  // Cuántas solicitudes o incidencias ha visto ya en el panel: las nuevas se resaltan.
  const [vistos, setVistos] = useState(0);

  const registros = useMemo(
    () =>
      chat.messages
        .filter((m) => m.role === 'assistant' && !m.error)
        .flatMap((m) => extractIncidencias(m.content)).length,
    [chat.messages]
  );
  const nuevos = registros > vistos;
  const [registro, registrosPlural] =
    textos.clase === 'solicitud' ? ['solicitud', 'solicitudes'] : ['incidencia', 'incidencias'];

  const start = startLink(contact, nombre);
  const whatsapp = demoWhatsappLink(contact, nombre);
  const host = web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  const abrirPanel = () => {
    setVistos(registros);
    setPanelOpen(true);
  };

  return (
    <div style={marcaStyle(color)} className="flex h-[100dvh] flex-col bg-canvas lg:bg-[var(--fondo)]">
      {/* Banda de Atiende, en neutro para no confundirse con la marca del negocio. */}
      {bannerOpen && (
        <div className="flex items-center gap-3 bg-ink px-4 py-2 text-[13px] text-canvas">
          <p className="min-w-0 flex-1 leading-snug">
            Demostración para {textos.titulo}
            <span className="hidden sm:inline">
              . {negocio ? 'Pruébala como lo haría un cliente.' : 'Pruébela como lo haría un vecino.'}
            </span>
          </p>
          {start && (
            <a
              href={start}
              target="_blank"
              rel="noopener noreferrer"
              className="press shrink-0 rounded-full bg-canvas px-3 py-1 font-semibold text-ink"
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

      <div className="flex min-h-0 flex-1 justify-center lg:gap-10 lg:px-8 lg:py-6">
        {/* En ordenador: la ficha del negocio o del municipio junto al chat. */}
        <aside className="hidden w-[320px] shrink-0 flex-col gap-8 overflow-y-auto py-2 lg:flex">
          <div className="flex items-center gap-4">
            <Escudo nombre={nombre} url={escudoUrl} size="lg" />
            <div className="min-w-0">
              <p className="text-balance text-xl font-semibold leading-tight tracking-[-0.02em]">
                {textos.titulo}
              </p>
              <p className="mt-1 text-muted">{subtitulo}</p>
            </div>
          </div>

          <dl className="space-y-3 text-[15px]">
            {telefono && (
              <Dato icon={<Phone size={18} weight="bold" aria-hidden />} label="Teléfono">
                <span className="tabular-nums">{telefono}</span>
              </Dato>
            )}
            {horario && (
              <Dato icon={<Clock size={18} weight="bold" aria-hidden />} label="Horario">
                {horario}
              </Dato>
            )}
            <Dato icon={<Globe size={18} weight="bold" aria-hidden />} label="Web">
              <a href={web} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                {host}
              </a>
            </Dato>
          </dl>

          {sugerencias.length > 0 && (
            <section>
              <h2 className="font-semibold">Prueba a preguntar</h2>
              <ul className="mt-3 space-y-2">
                {sugerencias.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => chat.send(s)}
                      disabled={chat.loading}
                      className="press w-full rounded-xl border-[1.5px] border-line-strong bg-surface px-4 py-3 text-left text-[15px] font-medium shadow-btn transition-colors duration-150 disabled:opacity-60 [@media(hover:hover)]:hover:border-cobalt [@media(hover:hover)]:hover:text-cobalt-text"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-auto text-sm leading-relaxed text-muted">
            Responde solo con la información de {textos.fuente}. Lo que no sabe, lo remite{' '}
            {negocio ? 'al centro' : 'al ayuntamiento'}.
          </p>
        </aside>

        <main className="flex min-h-0 w-full max-w-2xl flex-col bg-sunken sm:border-x sm:border-line lg:overflow-hidden lg:rounded-[22px] lg:border-[1.5px] lg:border-line-strong lg:shadow-soft">
          <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
            <Escudo nombre={nombre} url={escudoUrl} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold leading-tight sm:text-base">{textos.titulo}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok" aria-hidden />
                Asistente 24 horas
              </p>
            </div>
            <button
              type="button"
              onClick={abrirPanel}
              aria-label={
                nuevos
                  ? `Panel: ${registros} ${registros === 1 ? `${registro} nueva` : `${registrosPlural} nuevas`}`
                  : 'Panel'
              }
              className={`press flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] bg-surface px-3 py-1.5 text-sm font-semibold text-cobalt-text transition-[border-color,box-shadow] duration-200 [@media(hover:hover)]:hover:bg-cobalt-soft ${
                nuevos ? 'border-cobalt shadow-[0_0_0_4px_var(--cobalt-soft)]' : 'border-line-strong shadow-btn'
              }`}
            >
              <ChartBar size={16} weight="bold" aria-hidden />
              Panel
              {registros > 0 && (
                <span
                  key={registros}
                  aria-hidden
                  className="badge-pop -mr-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cobalt px-1.5 font-mono text-[11px] font-semibold tabular-nums text-cobalt-on"
                >
                  {registros}
                </span>
              )}
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
            chipsClassName={sugerencias.length > 0 ? 'lg:hidden' : ''}
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
                {textos.fuente}
              </a>{' '}
              ({fecha}).{' '}
              {!negocio && (
                <>
                  Emergencias: <strong className="text-ink">112</strong>.{' '}
                </>
              )}
              <a href="/privacidad" className="underline">
                Privacidad
              </a>
            </p>
          </footer>
        </main>
      </div>

      {panelOpen && (
        <Panel
          textos={textos}
          messages={chat.messages}
          onClose={() => setPanelOpen(false)}
          onReset={() => {
            chat.reset();
            setVistos(0);
            setPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}
