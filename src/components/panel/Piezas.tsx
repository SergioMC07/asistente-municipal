// Piezas comunes del panel (componentes de servidor).

import { CalendarCheck, DownloadSimple, Question, Tray } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';

export function Cabecera({ titulo, texto, excel }: { titulo: string; texto?: string; excel?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.03em]">{titulo}</h1>
        {texto && <p className="mt-0.5 text-sm text-muted">{texto}</p>}
      </div>
      {excel && (
        <a
          href={excel}
          download
          className="press inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold shadow-btn"
        >
          <DownloadSimple size={16} weight="bold" aria-hidden />
          Descargar en Excel
        </a>
      )}
    </div>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-[18px] border-[1.5px] border-dashed border-line-strong bg-surface/60 px-5 py-10 text-center">
      <Tray size={28} weight="duotone" className="mx-auto text-muted" aria-hidden />
      <p className="mt-3 font-semibold">{titulo}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export function SinPanel() {
  return (
    <Vacio titulo="Panel pendiente de activar">
      Falta conectar la base de datos. En cuanto esté, aquí aparecerán las conversaciones de tu asistente.
    </Vacio>
  );
}

const SENALES = {
  cita: { texto: 'Cita', icono: CalendarCheck, clase: 'bg-cobalt text-cobalt-on' },
  registro: { texto: 'Solicitud', icono: null, clase: 'bg-cobalt-soft text-cobalt-text ring-1 ring-inset ring-line-strong' },
  sin: { texto: 'Sin respuesta', icono: Question, clase: 'bg-sunken text-ink ring-1 ring-inset ring-line' },
} as const;

export function Senal({ tipo, texto }: { tipo: keyof typeof SENALES; texto?: string }) {
  const s = SENALES[tipo];
  const Icono = s.icono;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.clase}`}>
      {Icono && <Icono size={13} weight="bold" aria-hidden />}
      {texto ?? s.texto}
    </span>
  );
}
