// ============================================
// Incidencias dentro de las respuestas del asistente
// ============================================
// Cuando el vecino describe una incidencia, el asistente escribe una línea
// con el formato [[INCIDENCIA: tipo | lugar | detalle]]. La interfaz la
// convierte en una tarjeta. En la demo el registro es simulado.

export type Incidencia = { tipo: string; lugar: string; detalle: string };

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'incidencia'; data: Incidencia };

const INCIDENCIA_RE = /\[\[INCIDENCIA:\s*([^|\]]+?)\s*\|\s*([^|\]]+?)\s*\|\s*([^\]]+?)\s*\]\]/g;

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

  const segments: Segment[] = [];
  let last = 0;
  for (const match of source.matchAll(INCIDENCIA_RE)) {
    const index = match.index ?? 0;
    const before = source.slice(last, index);
    if (before.trim()) segments.push({ kind: 'text', text: before.trim() });
    segments.push({
      kind: 'incidencia',
      data: { tipo: match[1].trim(), lugar: match[2].trim(), detalle: match[3].trim() },
    });
    last = index + match[0].length;
  }
  const rest = source.slice(last);
  if (rest.trim()) segments.push({ kind: 'text', text: rest.trim() });
  return segments;
}

export function extractIncidencias(text: string): Incidencia[] {
  return splitIncidencias(text).flatMap((s) => (s.kind === 'incidencia' ? [s.data] : []));
}

/** Número de incidencia estable a partir de su contenido (p. ej. INC-4821). */
export function incidenciaId(data: Incidencia): string {
  const key = `${data.tipo}|${data.lugar}|${data.detalle}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return `INC-${String(hash % 9000 + 1000)}`;
}
