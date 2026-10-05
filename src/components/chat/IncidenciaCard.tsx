import { incidenciaId, type Incidencia } from '@/lib/incidencia';

const ETIQUETAS = {
  incidencia: {
    titulo: 'Incidencia registrada',
    lugar: 'Lugar',
    estado: 'Aviso al servicio municipal',
    notaReal: 'El ayuntamiento la revisa y avisa al servicio correspondiente.',
    nota: 'Demostración: en el servicio real se avisa al responsable y el vecino puede seguir el estado.',
  },
  solicitud: {
    titulo: 'Solicitud recibida',
    lugar: 'Cuándo',
    estado: 'Pendiente de llamada',
    notaReal: 'El centro te llamará lo antes posible.',
    nota: 'Demostración: en el servicio real se pide un teléfono y el centro llama al cliente.',
  },
} as const;

export function IncidenciaCard({ data, real = false }: { data: Incidencia; real?: boolean }) {
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
        {data.nombre && (
          <>
            <dt className="text-muted">Nombre</dt>
            <dd>{data.nombre}</dd>
          </>
        )}
        {data.telefono && (
          <>
            <dt className="text-muted">Teléfono</dt>
            <dd className="font-mono tabular-nums">{data.telefono}</dd>
          </>
        )}
        <dt className="text-muted">Estado</dt>
        <dd>{t.estado}</dd>
      </dl>
      <p className="mt-3 border-t border-line pt-2 text-xs text-muted">
        {real ? t.notaReal : t.nota}
      </p>
    </div>
  );
}
