import { describe, expect, it } from 'vitest';
import { MAX_HISTORY, MAX_MESSAGE_CHARS, prepareHistory, type ChatMessage } from './chat';
import { createRateLimiter } from './rate-limit';
import { isValidSlug, slugify } from './pueblo';

describe('prepareHistory', () => {
  it('rechaza conversaciones que no acaban en el vecino', () => {
    expect(prepareHistory([{ role: 'assistant', content: 'hola' }])).toBeNull();
  });

  it('rechaza mensajes demasiado largos', () => {
    const long = 'a'.repeat(MAX_MESSAGE_CHARS + 1);
    expect(prepareHistory([{ role: 'user', content: long }])).toBeNull();
  });

  it('recorta el historial y empieza siempre por el vecino', () => {
    const messages: ChatMessage[] = Array.from({ length: 31 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `m${i}`,
    }));
    const out = prepareHistory(messages)!;
    expect(out.length).toBeLessThanOrEqual(MAX_HISTORY);
    expect(out[0].role).toBe('user');
    expect(out[out.length - 1].content).toBe('m30');
  });
});

describe('createRateLimiter', () => {
  it('bloquea al superar el límite y libera al pasar la ventana', () => {
    const allow = createRateLimiter(2, 1_000);
    expect(allow('ip', 0)).toBe(true);
    expect(allow('ip', 1)).toBe(true);
    expect(allow('ip', 2)).toBe(false);
    expect(allow('otra', 2)).toBe(true);
    expect(allow('ip', 1_001)).toBe(true);
  });
});

describe('slugs', () => {
  it('convierte nombres con tildes y espacios', () => {
    expect(slugify('Villanueva de la Cañada')).toBe('villanueva-de-la-canada');
    expect(slugify("L'Alfàs del Pi")).toBe('l-alfas-del-pi');
  });

  it('no deja pasar rutas raras', () => {
    expect(isValidSlug('../secreto')).toBe(false);
    expect(isValidSlug('villaejemplo')).toBe(true);
  });
});
