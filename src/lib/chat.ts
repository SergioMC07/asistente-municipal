// ============================================
// Validación de las peticiones al chat
// ============================================

import { z } from 'zod';
import { SLUG_RE } from '@/lib/pueblo';

export const MAX_MESSAGE_CHARS = 1_000;
export const MAX_HISTORY = 20;

export const chatRequestSchema = z.object({
  slug: z.string().regex(SLUG_RE),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(MAX_MESSAGE_CHARS * 4),
      })
    )
    .min(1),
});

export type ChatMessage = z.infer<typeof chatRequestSchema>['messages'][number];

/**
 * Recorta el historial a los últimos mensajes y garantiza que el último es del
 * vecino y no supera el máximo. Devuelve null si la conversación no es válida.
 */
export function prepareHistory(messages: ChatMessage[]): ChatMessage[] | null {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user' || last.content.length > MAX_MESSAGE_CHARS) {
    return null;
  }
  const recent = messages.slice(-MAX_HISTORY);
  // El modelo espera que la conversación empiece por el vecino.
  const firstUser = recent.findIndex((m) => m.role === 'user');
  return recent.slice(firstUser);
}
