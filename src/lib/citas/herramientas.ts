// ============================================
// Herramientas de citas para la IA (function calling)
// ============================================

import type OpenAI from 'openai';
import { z } from 'zod';
import type { Pueblo } from '@/lib/pueblo';
import { createRateLimiter } from '@/lib/rate-limit';
import { marcaCita, reservar, verHuecos } from './servicio';

// Como mucho 3 reservas por IP y hora: frena a quien quiera llenar la agenda.
const permitirReserva = createRateLimiter(3, 60 * 60 * 1000);

export function herramientasCitas(pueblo: Pueblo): OpenAI.Chat.Completions.ChatCompletionTool[] {
  const tipos = pueblo.citas?.tipos ?? [];
  return [
    {
      type: 'function',
      function: {
        name: 'ver_huecos',
        description:
          'Devuelve los próximos huecos libres de la agenda de citas. Úsala siempre antes de ofrecer horas.',
        parameters: {
          type: 'object',
          properties: {
            desde: { type: 'string', description: 'Fecha AAAA-MM-DD desde la que buscar, si piden un día concreto.' },
            parte: { type: 'string', enum: ['mañana', 'tarde'], description: 'Solo mañanas o solo tardes, si lo piden.' },
          },
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reservar_cita',
        description:
          'Reserva un hueco libre. Usa la fecha y la hora exactas que devolvió ver_huecos, y el nombre y teléfono que dio la persona.',
        parameters: {
          type: 'object',
          properties: {
            fecha: { type: 'string', description: 'AAAA-MM-DD' },
            hora: { type: 'string', description: 'HH:MM' },
            nombre: { type: 'string' },
            telefono: { type: 'string' },
            tipo: { type: 'string', enum: tipos },
            nota: { type: 'string', description: 'Detalle breve si la persona lo ha dado.' },
          },
          required: ['fecha', 'hora', 'nombre', 'telefono'],
          additionalProperties: false,
        },
      },
    },
  ];
}

const argsHuecos = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  parte: z.enum(['mañana', 'tarde']).optional(),
});
const argsReserva = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  nombre: z.string().max(120),
  telefono: z.string().max(30),
  tipo: z.string().optional(),
  nota: z.string().max(500).optional(),
});

/**
 * Ejecuta una herramienta. Devuelve el resultado para el modelo y, si se ha
 * reservado, la marca de la tarjeta para la persona (la escribe el servidor,
 * no el modelo, para que no pueda aparecer una cita que no existe).
 */
export async function ejecutarHerramienta(
  pueblo: Pueblo,
  nombre: string,
  argumentos: string,
  ip: string
): Promise<{ resultado: unknown; marca?: string }> {
  let json: unknown;
  try {
    json = JSON.parse(argumentos || '{}');
  } catch {
    return { resultado: { ok: false, error: 'Argumentos no válidos.' } };
  }

  if (nombre === 'ver_huecos') {
    const a = argsHuecos.safeParse(json);
    return { resultado: await verHuecos(pueblo, a.success ? a.data : {}) };
  }

  if (nombre === 'reservar_cita') {
    const a = argsReserva.safeParse(json);
    if (!a.success) return { resultado: { ok: false, error: 'Faltan la fecha, la hora, el nombre o el teléfono.' } };
    if (!permitirReserva(`${ip}|${pueblo.slug}`)) {
      return { resultado: { ok: false, error: 'Demasiadas reservas seguidas. Que llame al centro.' } };
    }
    const r = await reservar(pueblo, a.data);
    if (!r.ok) return { resultado: r };
    return {
      resultado: { ok: true, cita: { dia: a.data.fecha, hora: a.data.hora, tipo: r.cita.tipo }, demostracion: r.demo },
      marca: marcaCita(r.cita, pueblo.citas?.lugar, r.demo),
    };
  }

  return { resultado: { ok: false, error: `Herramienta desconocida: ${nombre}` } };
}
