import { incidenciaId, type Incidencia } from '@/lib/incidencia';

const ETIQUETAS = {
  incidencia: {
    titulo: 'Incidencia registrada',
    lugar: 'Lugar',
    estado: 'Aviso al servicio municipal',
    nota: 'Demostración: en el servicio real se avisa al responsable y el vecino puede seguir el estado.',
  },
  solicitud: {
    titulo: 'Solicitud recibida',
    lugar: 'Cuándo',
    estado: 'Pendiente de llamada',
    nota: 'Demostración: en el servicio real se pide un teléfono y el centro llama al cliente.',
  },
} as const;

export function IncidenciaCard({ data }: { data: Incidencia }) {
  const t = ETIQUETAS[data.clase];
  return (
    <div className="rounded-xl border border-line bg-surface p-3.5 text-ink">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-muted">{t.titulo}</p>
          <p className="mt-0.5 font-semibold leading-snug">{data.tipo}</p>
        </div>
        <span className="sello shrink-0" aria-label={`Registro de entrada ${incidenciaId(data)}`}>
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em]">Registro</span>
          <span className="font-mono text-[12px] font-semibold tabular-nums">
            {incidenciaId(data)}
          </span>
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-muted">{t.lugar}</dt>
        <dd>{data.lugar}</dd>
        <dt className="text-muted">Detalle</dt>
        <dd>{data.detalle}</dd>
        <dt className="text-muted">Estado</dt>
        <dd>{t.estado}</dd>
      </dl>
      <p className="mt-3 border-t border-line pt-2 text-xs text-muted">
        {t.nota}
      </p>
    </div>
  );
}
