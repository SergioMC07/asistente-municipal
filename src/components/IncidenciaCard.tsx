import { incidenciaId, type Incidencia } from '@/lib/incidencia';

export function IncidenciaCard({ data }: { data: Incidencia }) {
  return (
    <div className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50 text-municipal-ink">
      <div className="flex items-center justify-between gap-2 bg-amber-100 px-3 py-2">
        <span className="text-sm font-semibold">Incidencia registrada</span>
        <span className="font-mono text-xs text-municipal-muted">{incidenciaId(data)}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-2.5 text-sm">
        <dt className="text-municipal-muted">Tipo</dt>
        <dd className="font-medium">{data.tipo}</dd>
        <dt className="text-municipal-muted">Lugar</dt>
        <dd className="font-medium">{data.lugar}</dd>
        <dt className="text-municipal-muted">Detalle</dt>
        <dd>{data.detalle}</dd>
        <dt className="text-municipal-muted">Estado</dt>
        <dd className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
          Aviso a la brigada municipal
        </dd>
      </dl>
      <p className="border-t border-amber-200 px-3 py-1.5 text-xs text-municipal-muted">
        Demostración: en el servicio real se avisa al responsable y el vecino puede seguir el estado.
      </p>
    </div>
  );
}
