// ============================================
// Incidencias y solicitudes dentro de las respuestas del asistente
// ============================================
// Cuando el vecino describe una incidencia, el asistente escribe una línea
// con el formato [[INCIDENCIA: tipo | lugar | detalle]]. En un negocio,
// cuando un cliente quiere apuntarse, escribe [[SOLICITUD: qué | cuándo | detalle]].
// Las citas reservadas las escribe el servidor (nunca el modelo) como
// [[CITA: id | tipo | inicio | fin | lugar | nombre | demo|real]].
// La interfaz convierte cada una en una tarjeta.

import type { Clase } from '@/lib/entidad';

/** En una solicitud, `lugar` guarda cuándo le viene bien al cliente. */
export type Incidencia = { clase: Clase; tipo: string; lugar: string; detalle: string };

export type CitaMarca = {
  id: string;
  tipo: string;
  inicio: string;
  fin: string;
  lugar: string;
  nombre: string;
  demo: boolean;
};

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'incidencia'; data: Incidencia }
  | { kind: 'cita'; data: CitaMarca };

const INCIDENCIA_RE = /\[\[(INCIDENCIA|SOLICITUD):\s*([^|\]]+?)\s*\|\s*([^|\]]+?)\s*\|\s*([^\]]+?)\s*\]\]/g;
const CITA_RE = /\[\[CITA:\s*([^\]]+?)\s*\]\]/g;

type Coincidencia = { index: number; length: number; segment: Segment };

function citas(source: string): Coincidencia[] {
  return [...source.matchAll(CITA_RE)].flatMap((m) => {
    const f = m[1].split('|').map((x) => x.trim());
    if (f.length !== 7) return [];
    const [id, tipo, inicio, fin, lugar, nombre, modo] = f;
    return [
      {
        index: m.index ?? 0,
        length: m[0].length,
        segment: { kind: 'cita' as const, data: { id, tipo, inicio, fin, lugar, nombre, demo: modo !== 'real' } },
      },
    ];
  });
}

/**
 * Separa el texto de las incidencias. Mientras la respuesta llega en
 * streaming, oculta una etiqueta a medio escribir para que no parpadee.
 */
export function splitIncidencias(text: string, streaming = false): Segment[] {
  let source = text;
  if (streaming) {
    const open = source.lastIndexOf('[[');
    if (open !== -1 && source.indexOf(']]', open) === -1) source = source.slice(0, open);
  }

  const encontradas: Coincidencia[] = [
    ...[...source.matchAll(INCIDENCIA_RE)].map((match) => ({
      index: match.index ?? 0,
      length: match[0].length,
      segment: {
        kind: 'incidencia' as const,
        data: {
          clase: (match[1] === 'SOLICITUD' ? 'solicitud' : 'incidencia') as Clase,
          tipo: match[2].trim(),
          lugar: match[3].trim(),
          detalle: match[4].trim(),
        },
      },
    })),
    ...citas(source),
  ].sort((a, b) => a.index - b.index);

  const segments: Segment[] = [];
  let last = 0;
  for (const { index, length, segment } of encontradas) {
    const before = source.slice(last, index);
    if (before.trim()) segments.push({ kind: 'text', text: before.trim() });
    segments.push(segment);
    last = index + length;
  }
  const rest = source.slice(last);
  if (rest.trim()) segments.push({ kind: 'text', text: rest.trim() });
  return segments;
}

export function extractIncidencias(text: string): Incidencia[] {
  return splitIncidencias(text).flatMap((s) => (s.kind === 'incidencia' ? [s.data] : []));
}

export function extractCitas(text: string): CitaMarca[] {
  return splitIncidencias(text).flatMap((s) => (s.kind === 'cita' ? [s.data] : []));
}

/** Número estable a partir del contenido (p. ej. INC-4821 o SOL-1093). */
export function incidenciaId(data: Incidencia): string {
  const key = `${data.clase}|${data.tipo}|${data.lugar}|${data.detalle}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return `${data.clase === 'solicitud' ? 'SOL' : 'INC'}-${String(hash % 9000 + 1000)}`;
}
