// ============================================
// Ver huecos y reservar: lo que usa el asistente
// ============================================
// La IA nunca inventa horas: llama a estas funciones y solo ofrece lo que
// devuelven. Antes de reservar se vuelve a comprobar que el hueco sigue libre.
// En modo demo (o sin base de datos) la reserva se simula y no avisa a nadie.

import type { Pueblo } from '@/lib/pueblo';
import { huecosLibres, ocupadosDeDemo, proponerHuecos, telefonoValido, type Agenda, type Hueco } from './agenda';
import { avisarCita } from './avisos';
import { citasStore, type Cita, type CitasStore } from './store';

export type ResultadoHuecos =
  | { ok: true; huecos: Pick<Hueco, 'fecha' | 'hora' | 'etiqueta'>[]; hayMas: boolean }
  | { ok: false; error: string };

export type ResultadoReserva =
  | { ok: true; cita: Cita; demo: boolean }
  | { ok: false; error: string; alternativas?: Pick<Hueco, 'fecha' | 'hora' | 'etiqueta'>[] };

type Contexto = { pueblo: Pueblo; agenda: Agenda; store: CitasStore | null; real: boolean };

function contexto(pueblo: Pueblo, store = citasStore()): Contexto | null {
  const agenda = pueblo.citas;
  if (!agenda) return null;
  const real = agenda.modo === 'real' && !!store;
  return { pueblo, agenda, store: real ? store : null, real };
}

async function libres(ctx: Contexto, ahora: Date): Promise<Hueco[]> {
  const { agenda, pueblo } = ctx;
  const hasta = new Date(ahora.getTime() + (agenda.dias + 1) * 86_400_000);
  if (ctx.real && ctx.store) {
    const [ocupados, bloqueos] = await Promise.all([
      ctx.store.confirmadas(pueblo.slug, ahora, hasta),
      ctx.store.bloqueos(pueblo.slug, ahora, hasta),
    ]);
    return huecosLibres(agenda, ahora, ocupados, bloqueos);
  }
  const todos = huecosLibres(agenda, ahora);
  return huecosLibres(agenda, ahora, ocupadosDeDemo(pueblo.slug, todos));
}

const sinInicio = ({ fecha, hora, etiqueta }: Hueco) => ({ fecha, hora, etiqueta });

export async function verHuecos(
  pueblo: Pueblo,
  opciones: { desde?: string; parte?: 'mañana' | 'tarde' },
  ahora = new Date(),
  store?: CitasStore | null
): Promise<ResultadoHuecos> {
  const ctx = contexto(pueblo, store === undefined ? citasStore() : store);
  if (!ctx) return { ok: false, error: 'Este centro no tiene agenda de citas.' };
  const todos = await libres(ctx, ahora);
  const elegidos = proponerHuecos(todos, opciones);
  return { ok: true, huecos: elegidos.map(sinInicio), hayMas: todos.length > elegidos.length };
}

export async function reservar(
  pueblo: Pueblo,
  datos: { fecha: string; hora: string; nombre: string; telefono: string; tipo?: string; nota?: string },
  ahora = new Date(),
  store?: CitasStore | null
): Promise<ResultadoReserva> {
  const ctx = contexto(pueblo, store === undefined ? citasStore() : store);
  if (!ctx) return { ok: false, error: 'Este centro no tiene agenda de citas.' };

  const nombre = datos.nombre.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (nombre.length < 2) return { ok: false, error: 'Falta el nombre de la persona.' };
  const telefono = telefonoValido(datos.telefono);
  if (!telefono) return { ok: false, error: 'El teléfono no parece válido: deben ser 9 cifras.' };
  const tipo = ctx.agenda.tipos.includes(datos.tipo ?? '') ? datos.tipo! : ctx.agenda.tipos[0];

  const todos = await libres(ctx, ahora);
  const hueco = todos.find((h) => h.fecha === datos.fecha && h.hora === datos.hora);
  const alternativas = () => proponerHuecos(todos, { desde: datos.fecha, limite: 3 }).map(sinInicio);
  if (!hueco) return { ok: false, error: 'Ese hueco no está libre.', alternativas: alternativas() };

  const nueva = {
    slug: pueblo.slug,
    tipo,
    inicio: hueco.inicio,
    fin: new Date(new Date(hueco.inicio).getTime() + ctx.agenda.duracion * 60_000).toISOString(),
    nombre,
    telefono,
    nota: datos.nota?.trim().slice(0, 300) || null,
    origen: 'asistente' as const,
  };

  if (!ctx.real || !ctx.store) {
    const id = `DEMO-${Math.abs(hueco.inicio.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 9000 + 1000}`;
    return { ok: true, demo: true, cita: { ...nueva, id, plaza: 1, estado: 'confirmada' } };
  }

  const cita = await ctx.store.crear(nueva, ctx.agenda.capacidad);
  if (!cita) return { ok: false, error: 'Ese hueco se acaba de ocupar.', alternativas: alternativas() };
  await avisarCita(pueblo, cita);
  return { ok: true, demo: false, cita };
}

/** Línea que la interfaz convierte en la tarjeta de «Cita confirmada». */
export function marcaCita(cita: Cita, lugar: string | undefined, demo: boolean): string {
  const limpio = (s: string) => s.replace(/[|\]\[]/g, '/').trim();
  return `[[CITA: ${limpio(cita.id)} | ${limpio(cita.tipo)} | ${cita.inicio} | ${cita.fin} | ${limpio(lugar ?? '')} | ${limpio(cita.nombre)} | ${demo ? 'demo' : 'real'}]]`;
}
