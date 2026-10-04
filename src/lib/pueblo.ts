// ============================================
// Ficha de un pueblo: esquema y carga desde disco
// ============================================
// Cada demo es un JSON en data/pueblos/<slug>.json generado por
// `npm run demo`. Sin base de datos: para enseñar demos basta con el disco.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const puebloSchema = z.object({
  slug: z.string().regex(SLUG_RE),
  nombre: z.string().min(1),
  provincia: z.string().optional(),
  web: z.string().url(),
  escudoUrl: z.string().url().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  horario: z.string().optional(),
  /** Ficha en markdown con todo lo que el asistente puede responder. */
  ficha: z.string().min(1),
  /** Preguntas de ejemplo que se muestran como botones en el chat. */
  sugerencias: z.array(z.string()).default([]),
  /** Páginas de la web municipal de las que salió la ficha. */
  fuentes: z.array(z.string()).default([]),
  generadoEl: z.string(),
});

export type Pueblo = z.infer<typeof puebloSchema>;

export const PUEBLOS_DIR = path.join(process.cwd(), 'data', 'pueblos');

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/** Devuelve la ficha del pueblo o null si no existe o no es válida. */
export async function getPueblo(slug: string): Promise<Pueblo | null> {
  // El slug llega de la URL: validarlo evita leer rutas fuera de la carpeta.
  if (!isValidSlug(slug)) return null;
  try {
    const raw = await fs.readFile(path.join(PUEBLOS_DIR, `${slug}.json`), 'utf8');
    const parsed = puebloSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Convierte "Villanueva de la Cañada" en "villanueva-de-la-canada". */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
