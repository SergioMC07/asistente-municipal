// ============================================
// Agenda de citas: huecos libres a partir del horario del negocio
// ============================================
// Los huecos no se guardan: se calculan en cada momento a partir del horario
// de citas de la ficha, quitando los pasados, los que no respetan la antelación
// mínima, los días cerrados, los bloqueos y los que ya están llenos. Así la
// agenda avanza sola: cada día entra uno nuevo al final de la ventana.

import { z } from 'zod';

export const ZONA = 'Europe/Madrid';

const RANGO_RE = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

export const agendaSchema = z.object({
  /** Motivos de cita que se ofrecen, p. ej. ["Información y matrícula"]. */
  tipos: z.array(z.string().min(1)).min(1),
  /** Minutos de cada cita. Todas las citas del negocio duran lo mismo. */
  duracion: z.number().int().min(5).max(240),
  /** Por día de la semana (1 = lunes … 7 = domingo), tramos "HH:MM-HH:MM". */
  horario: z.record(z.enum(['1', '2', '3', '4', '5', '6', '7']), z.array(z.string().regex(RANGO_RE))),
  /** Citas a la vez en el mismo hueco. */
  capacidad: z.number().int().min(1).max(20).default(1),
  /** Antelación mínima en minutos: no se ofrecen huecos más cercanos. */
  antelacion: z.number().int().min(0).default(120),
  /** Días hacia delante que se ofrecen. */
  dias: z.number().int().min(1).max(90).default(14),
  /** Fechas cerradas (festivos, vacaciones), "YYYY-MM-DD". */
  cerrado: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
  /** Dónde es la cita, p. ej. "En la autoescuela, C/ de Ramon Llull, 31". */
  lugar: z.string().optional(),
  /** "real" guarda la cita y avisa al negocio; "demo" la simula. */
  modo: z.enum(['demo', 'real']).default('demo'),
  /** Email del negocio para los avisos de cita (modo real). */
  avisoEmail: z.string().email().optional(),
  /** SHA-256 del enlace secreto de gestión del negocio (npm run gestion). */
  gestion: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export type Agenda = z.infer<typeof agendaSchema>;

export type Hueco = {
  /** Inicio en UTC (ISO): identifica el hueco. */
  inicio: string;
  /** Fecha y hora en Madrid, para hablar con el modelo y con la persona. */
  fecha: string;
  hora: string;
  /** "miércoles 8 de octubre a las 17:30" */
  etiqueta: string;
};

export type Ocupado = { inicio: string };
export type Bloqueo = { inicio: string; fin: string };

// ---------- Fechas en hora de Madrid ----------

const partes = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
});

const DIAS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function enMadrid(ms: number) {
  const p = Object.fromEntries(partes.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    h: Number(p.hour),
    min: Number(p.minute),
    s: Number(p.second),
    diaSemana: DIAS_EN.indexOf(p.weekday) + 1,
  };
}

/** Minutos que Madrid va por delante de UTC en ese instante (60 o 120). */
function desfase(ms: number): number {
  const t = enMadrid(ms);
  return (Date.UTC(t.y, t.m - 1, t.d, t.h, t.min, t.s) - ms) / 60_000;
}

/** "2026-10-08" + "17:30" en Madrid → instante UTC. Tiene en cuenta el cambio de hora. */
export function madridAUtc(fecha: string, hora: string): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  const local = Date.UTC(y, m - 1, d, hh, mm);
  let utc = local - desfase(local) * 60_000;
  utc = local - desfase(utc) * 60_000;
  return new Date(utc);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha, hora y día de la semana (1 = lunes) en Madrid. */
export function fechaMadrid(date: Date) {
  const t = enMadrid(date.getTime());
  return {
    fecha: `${t.y}-${pad(t.m)}-${pad(t.d)}`,
    hora: `${pad(t.h)}:${pad(t.min)}`,
    diaSemana: t.diaSemana,
  };
}

function sumarDias(fecha: string, n: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

function diaSemana(fecha: string): number {
  const [y, m, d] = fecha.split('-').map(Number);
  return ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1;
}

const etiquetaDia = new Intl.DateTimeFormat('es-ES', {
  timeZone: ZONA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** "miércoles 8 de octubre a las 17:30" */
export function etiquetaHueco(inicio: Date): string {
  return `${etiquetaDia.format(inicio)} a las ${fechaMadrid(inicio).hora}`;
}

const aMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const aHora = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

// ---------- Huecos ----------

/** Todos los huecos libres de la ventana de la agenda, en orden. */
export function huecosLibres(
  agenda: Agenda,
  ahora: Date,
  ocupados: Ocupado[] = [],
  bloqueos: Bloqueo[] = []
): Hueco[] {
  const hoy = fechaMadrid(ahora).fecha;
  const minimo = ahora.getTime() + agenda.antelacion * 60_000;
  const cerrados = new Set(agenda.cerrado);

  const porInicio = new Map<string, number>();
  for (const o of ocupados) {
    const k = new Date(o.inicio).toISOString();
    porInicio.set(k, (porInicio.get(k) ?? 0) + 1);
  }
  const bloq = bloqueos.map((b) => [new Date(b.inicio).getTime(), new Date(b.fin).getTime()] as const);
  const durMs = agenda.duracion * 60_000;

  const huecos: Hueco[] = [];
  for (let i = 0; i < agenda.dias; i++) {
    const fecha = sumarDias(hoy, i);
    if (cerrados.has(fecha)) continue;
    const tramos = agenda.horario[String(diaSemana(fecha)) as keyof Agenda['horario']] ?? [];
    for (const tramo of tramos) {
      const [desde, hasta] = tramo.split('-').map(aMin);
      for (let t = desde; t + agenda.duracion <= hasta; t += agenda.duracion) {
        const hora = aHora(t);
        const inicio = madridAUtc(fecha, hora);
        const ms = inicio.getTime();
        if (ms < minimo) continue;
        const iso = inicio.toISOString();
        if ((porInicio.get(iso) ?? 0) >= agenda.capacidad) continue;
        if (bloq.some(([b0, b1]) => ms < b1 && ms + durMs > b0)) continue;
        huecos.push({ inicio: iso, fecha, hora, etiqueta: etiquetaHueco(inicio) });
      }
    }
  }
  return huecos;
}

/**
 * Selección para ofrecer en la conversación: a partir de una fecha y, si se
 * pide, solo mañanas o tardes. Como mucho dos huecos por día, para dar a
 * elegir entre días distintos sin soltar una lista enorme.
 */
export function proponerHuecos(
  huecos: Hueco[],
  opciones: { desde?: string; parte?: 'mañana' | 'tarde'; limite?: number } = {}
): Hueco[] {
  const { desde, parte, limite = 6 } = opciones;
  const porDia = new Map<string, number>();
  const elegidos: Hueco[] = [];
  for (const h of huecos) {
    if (desde && h.fecha < desde) continue;
    if (parte === 'mañana' && h.hora >= '14:00') continue;
    if (parte === 'tarde' && h.hora < '14:00') continue;
    const n = porDia.get(h.fecha) ?? 0;
    if (n >= 2) continue;
    porDia.set(h.fecha, n + 1);
    elegidos.push(h);
    if (elegidos.length >= limite) break;
  }
  return elegidos;
}

/**
 * Huecos «ocupados» de mentira para las demos: así la agenda parece real
 * (no todo está libre) y es siempre la misma para el mismo día.
 */
export function ocupadosDeDemo(slug: string, huecos: Hueco[]): Ocupado[] {
  return huecos
    .filter((h) => {
      let hash = 0;
      for (const c of `${slug}|${h.inicio}`) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
      return hash % 3 === 0;
    })
    .map((h) => ({ inicio: h.inicio }));
}

/** Teléfono español razonable: 9 cifras empezando por 6, 7, 8 o 9 (con o sin +34). */
export function telefonoValido(telefono: string): string | null {
  const d = telefono.replace(/[\s.\-()]/g, '').replace(/^(\+34|0034)/, '');
  return /^[6789]\d{8}$/.test(d) ? `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}` : null;
}
