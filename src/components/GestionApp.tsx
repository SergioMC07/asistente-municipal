'use client';

import { CalendarBlank, Copy, Phone, Prohibit, X } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { DatosAgenda } from '@/lib/citas/vista';

type Real = Extract<DatosAgenda, { estado: 'real' }>;
type CitaVista = Real['citas'][number];
type Libre = Real['libres'][number];

const diaLargo = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function nombreDia(dia: string, hoy: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  const manana = new Date(new Date(`${hoy}T12:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10);
  const texto = diaLargo.format(d);
  if (dia === hoy) return `Hoy, ${texto}`;
  if (dia === manana) return `Mañana, ${texto}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-[18px] border-[1.5px] border-line-strong bg-surface p-5 shadow-soft">
      <h2 className="text-lg font-semibold tracking-[-0.01em]">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const campo =
  'w-full rounded-xl border-[1.5px] border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink focus:border-cobalt focus-visible:outline-none';
const boton =
  'press inline-flex items-center justify-center gap-1.5 rounded-full bg-cobalt px-4 py-2.5 font-semibold text-cobalt-on shadow-btn disabled:opacity-50';

export function GestionApp({
  api,
  feed: rutaFeed,
  datos,
  className = 'mx-auto max-w-2xl px-5 py-6',
}: {
  /** Ruta de las acciones (con el token del enlace secreto o con la sesión del panel). */
  api: string;
  /** Ruta del calendario suscribible. */
  feed: string;
  datos: Real;
  className?: string;
}) {
  const { citas, bloqueos, libres, hoy } = datos;
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const porDia = useMemo(() => {
    const m = new Map<string, CitaVista[]>();
    for (const c of citas) m.set(c.dia, [...(m.get(c.dia) ?? []), c]);
    return [...m.entries()];
  }, [citas]);

  const libresPorDia = useMemo(() => {
    const m = new Map<string, Libre[]>();
    for (const h of libres) m.set(h.fecha, [...(m.get(h.fecha) ?? []), h]);
    return [...m.entries()];
  }, [libres]);

  async function enviar(cuerpo: Record<string, unknown>, ok: string) {
    setOcupado(true);
    setMensaje(null);
    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'No se ha podido guardar.');
      setMensaje({ ok: true, texto: ok });
      router.refresh();
      return true;
    } catch (err) {
      setMensaje({ ok: false, texto: err instanceof Error ? err.message : 'No se ha podido guardar.' });
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function apuntar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const [fecha, hora] = String(f.get('hueco')).split(' ');
    const ok = await enviar(
      { accion: 'apuntar', fecha, hora, nombre: f.get('nombre'), telefono: f.get('telefono'), nota: f.get('nota') || undefined },
      'Cita apuntada. El asistente ya no ofrecerá ese hueco.'
    );
    if (ok) form.reset();
  }

  async function bloquear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await enviar(
      { accion: 'bloquear', fecha: f.get('fecha'), desde: f.get('desde'), hasta: f.get('hasta'), motivo: f.get('motivo') || undefined },
      'Horas bloqueadas. El asistente no las ofrecerá.'
    );
    if (ok) form.reset();
  }

  // La dirección del calendario depende del dominio: se calcula ya en el navegador.
  const [feed, setFeed] = useState('');
  useEffect(() => {
    setFeed(`${window.location.origin}${rutaFeed}`);
  }, [rutaFeed]);

  return (
    <div className={`space-y-5 ${className}`}>
      {mensaje && (
        <p
          role="status"
          className={`rounded-xl border-[1.5px] px-4 py-3 text-sm font-medium ${
            mensaje.ok ? 'border-cobalt bg-cobalt-soft text-cobalt-text' : 'border-danger bg-surface text-danger'
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      <Bloque titulo={`Próximas citas (${citas.length})`}>
        {porDia.length === 0 ? (
          <p className="text-muted">No hay citas en los próximos días.</p>
        ) : (
          <div className="space-y-5">
            {porDia.map(([dia, lista]) => (
              <div key={dia}>
                <h3 className="text-sm font-semibold text-muted">{nombreDia(dia, hoy)}</h3>
                <ul className="mt-2 divide-y divide-[var(--line)] rounded-xl border border-line">
                  {lista.map((c) => (
                    <li key={c.id} className="flex items-start gap-3 px-3.5 py-3">
                      <span className="w-12 shrink-0 font-mono text-lg font-semibold tabular-nums text-cobalt-text">
                        {c.etiqueta.slice(-5)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug">
                          {c.nombre}
                          {c.origen === 'manual' && (
                            <span className="ml-2 rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-muted">
                              Apuntada por ti
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted">{c.tipo}</p>
                        <a
                          href={`tel:${c.telefono.replace(/\s/g, '')}`}
                          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-cobalt-text underline underline-offset-4"
                        >
                          <Phone size={14} weight="bold" aria-hidden />
                          {c.telefono}
                        </a>
                        {c.nota && <p className="mt-1 text-sm">{c.nota}</p>}
                      </div>
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() =>
                          confirm(`¿Cancelar la cita de ${c.nombre} (${c.etiqueta})? Avisa tú a la persona.`) &&
                          enviar({ accion: 'cancelar', id: c.id }, 'Cita cancelada. El hueco vuelve a estar libre.')
                        }
                        className="press flex shrink-0 items-center gap-1 rounded-full border-[1.5px] border-line-strong px-3 py-1.5 text-sm font-medium text-muted disabled:opacity-50"
                      >
                        <X size={14} weight="bold" aria-hidden />
                        Cancelar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Bloque>

      <Bloque titulo="Apuntar una cita que te han pedido por teléfono">
        {libres.length === 0 ? (
          <p className="text-muted">No quedan huecos libres en los próximos días.</p>
        ) : (
          <form onSubmit={apuntar} className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium">
              Hueco
              <select name="hueco" required className={campo}>
                {libresPorDia.map(([dia, lista]) => (
                  <optgroup key={dia} label={nombreDia(dia, hoy)}>
                    {lista.map((h) => (
                      <option key={h.fecha + h.hora} value={`${h.fecha} ${h.hora}`}>
                        {h.etiqueta}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                Nombre
                <input name="nombre" required minLength={2} maxLength={80} className={campo} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Teléfono
                <input name="telefono" required inputMode="tel" maxLength={20} className={campo} />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-medium">
              Nota (opcional)
              <input name="nota" maxLength={300} className={campo} />
            </label>
            <button type="submit" disabled={ocupado} className={`${boton} justify-self-start`}>
              <CalendarBlank size={18} weight="bold" aria-hidden />
              Apuntar cita
            </button>
          </form>
        )}
      </Bloque>

      <Bloque titulo="Bloquear horas (festivos, vacaciones, reuniones)">
        <form onSubmit={bloquear} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-medium">
              Día
              <input type="date" name="fecha" required min={hoy} className={campo} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Desde
              <input type="time" name="desde" required defaultValue="00:00" className={campo} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Hasta
              <input type="time" name="hasta" required defaultValue="23:59" className={campo} />
            </label>
          </div>
          <label className="grid gap-1.5 text-sm font-medium">
            Motivo (opcional)
            <input name="motivo" maxLength={120} placeholder="Vacaciones, festivo local…" className={campo} />
          </label>
          <button type="submit" disabled={ocupado} className={`${boton} justify-self-start`}>
            <Prohibit size={18} weight="bold" aria-hidden />
            Bloquear
          </button>
        </form>
        {bloqueos.length > 0 && (
          <ul className="mt-5 divide-y divide-[var(--line)] rounded-xl border border-line">
            {bloqueos.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-3.5 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{b.etiqueta}</p>
                  {b.motivo && <p className="text-muted">{b.motivo}</p>}
                </div>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => enviar({ accion: 'desbloquear', id: b.id }, 'Bloqueo quitado.')}
                  className="press rounded-full border-[1.5px] border-line-strong px-3 py-1.5 font-medium text-muted disabled:opacity-50"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </Bloque>

      <Bloque titulo="Ver las citas en tu calendario">
        <p className="leading-relaxed text-muted">
          Añade este enlace a tu Google Calendar (Otros calendarios → + → Desde URL), Outlook o iPhone y las citas
          aparecerán solas. Se actualiza cada pocas horas. No lo compartas: da acceso a tu agenda.
        </p>
        <div className="mt-3 flex gap-2">
          <input readOnly value={feed} className={`${campo} font-mono text-xs`} onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(feed);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1500);
            }}
            className="press flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-line-strong px-3.5 font-semibold text-cobalt-text"
          >
            <Copy size={16} weight="bold" aria-hidden />
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </Bloque>
    </div>
  );
}
