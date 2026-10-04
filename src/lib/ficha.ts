// ============================================
// Ficha del pueblo a partir de las páginas leídas
// ============================================

import OpenAI from 'openai';
import { z } from 'zod';
import type { PageText } from '@/lib/crawl';

const FICHA_MODEL = process.env.OPENAI_FICHA_MODEL || 'gpt-4.1-mini';
const MAX_SOURCE_CHARS = 90_000;

const fichaResponseSchema = z.object({
  nombre: z.string().min(1),
  provincia: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  horario: z.string().optional().nullable(),
  ficha: z.string().min(50),
  sugerencias: z.array(z.string()).default([]),
});

export type FichaResult = z.infer<typeof fichaResponseSchema>;

/** Junta el texto de las páginas, con su URL, sin pasarse del límite. */
export function buildSourceText(pages: PageText[], maxChars = MAX_SOURCE_CHARS): string {
  let out = '';
  for (const p of pages) {
    const block = `### ${p.title || p.url}\nURL: ${p.url}\n${p.text}\n\n`;
    if (out.length + block.length > maxChars) {
      const room = maxChars - out.length;
      if (room > 500) out += block.slice(0, room);
      break;
    }
    out += block;
  }
  return out;
}

const SYSTEM = `Eres un documentalista que prepara la ficha de un ayuntamiento español para un asistente de atención al vecino.

A partir del texto de su web, escribe una ficha en markdown con SOLO información que aparezca en el texto. No inventes ni completes datos: si algo no aparece, no lo pongas.

Organiza la ficha con estos apartados (omite los que no tengan datos):
## Ayuntamiento (dirección, teléfonos, email, horario de atención, alcalde/sa si aparece)
## Sede electrónica y trámites (enlaces y pasos generales: padrón, certificados, registro, licencias…)
## Residuos y limpieza (recogida de basura, enseres, punto limpio, días y teléfonos)
## Impuestos y tasas (IBI, vehículos, agua, basura: plazos y forma de pago si aparecen)
## Servicios municipales (agua, cementerio, biblioteca, casa de cultura, juzgado de paz, policía local…)
## Deportes (instalaciones, horarios, piscina)
## Servicios sociales y mayores
## Salud (consultorio, centro de salud, farmacia) y emergencias
## Educación (colegios, institutos, escuela infantil)
## Transporte
## Fiestas y agenda (fechas tal como aparecen, indicando el año si consta)
## Teléfonos de interés
## Otros datos útiles

Reglas:
- Conserva teléfonos, horarios, fechas, importes y URLs exactamente como aparecen.
- Incluye la URL de la página cuando ayude al vecino a ampliar o hacer un trámite.
- Frases cortas y listas. Nada de publicidad ni noticias pasadas sin utilidad.

Responde SOLO con un JSON con estas claves:
{
  "nombre": "nombre del municipio, sin 'Ayuntamiento de'",
  "provincia": "provincia o null",
  "telefono": "teléfono principal del ayuntamiento o null",
  "email": "email principal o null",
  "horario": "horario de atención al público o null",
  "ficha": "la ficha en markdown",
  "sugerencias": ["4 preguntas cortas que un vecino haría y que la ficha SÍ puede responder"]
}`;

export async function generateFicha(webUrl: string, pages: PageText[]): Promise<FichaResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Falta OPENAI_API_KEY en el entorno');
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: FICHA_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Web municipal: ${webUrl}\n\n${buildSourceText(pages)}` },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('La IA no ha devuelto la ficha');
  return fichaResponseSchema.parse(JSON.parse(content));
}
