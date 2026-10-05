'use client';

import { CalendarPlus } from '@phosphor-icons/react/dist/ssr';
import { ics } from '@/lib/citas/ics';
import type { CitaMarca } from '@/lib/incidencia';

const cuando = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'Europe/Madrid',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const hora = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' });

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Descarga la cita como .ics: el móvil la abre en su calendario. */
function anadirAlCalendario(cita: CitaMarca, negocio: string) {
  const texto = ics(
    [
      {
        uid: cita.id,
        inicio: cita.inicio,
        fin: cita.fin,
        titulo: `${cita.tipo} · ${negocio}`,
        lugar: cita.lugar || undefined,
      },
    ],
    negocio
  );
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cita.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CitaCard({ data, negocio }: { data: CitaMarca; negocio: string }) {
  const inicio = new Date(data.inicio);
  return (
    <div className="rounded-xl border-[1.5px] border-cobalt bg-surface p-3.5 text-ink">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-muted">Cita confirmada</p>
          <p className="mt-0.5 font-semibold leading-snug">{mayuscula(cuando.format(inicio))}</p>
          <p className="font-mono text-2xl font-semibold tabular-nums text-cobalt-text">{hora.format(inicio)}</p>
        </div>
        <span className="sello shrink-0" aria-label={`Cita ${data.id}`}>
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em]">Cita</span>
          <span className="font-mono text-[12px] font-semibold tabular-nums">
            {data.id.startsWith('DEMO') ? data.id : data.id.slice(0, 8).toUpperCase()}
          </span>
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-muted">Motivo</dt>
        <dd>{data.tipo}</dd>
        {data.lugar && (
          <>
            <dt className="text-muted">Lugar</dt>
            <dd>{mayuscula(data.lugar)}</dd>
          </>
        )}
        <dt className="text-muted">A nombre de</dt>
        <dd>{data.nombre}</dd>
      </dl>
      <button
        type="button"
        onClick={() => anadirAlCalendario(data, negocio)}
        className="press mt-3 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold text-cobalt-text shadow-btn [@media(hover:hover)]:hover:border-cobalt"
      >
        <CalendarPlus size={16} weight="bold" aria-hidden />
        Añadir a mi calendario
      </button>
      {data.demo && (
        <p className="mt-3 border-t border-line pt-2 text-xs text-muted">
          Demostración: en el servicio real la cita se guarda en la agenda y le llega un aviso al centro.
        </p>
      )}
    </div>
  );
}
