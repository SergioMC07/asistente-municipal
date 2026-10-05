// ============================================
// Acceso del negocio a su agenda con un enlace secreto
// ============================================
// `npm run gestion -- <slug>` crea un token aleatorio y guarda en la ficha
// solo su SHA-256. El negocio entra con /gestion/<slug>?t=<token>; para
// revocarlo basta con generar otro.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Pueblo } from '@/lib/pueblo';

export function nuevoToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function tokenValido(pueblo: Pueblo, token: string | null | undefined): boolean {
  const guardado = pueblo.citas?.gestion;
  if (!guardado || !token) return false;
  const a = Buffer.from(hashToken(token), 'hex');
  const b = Buffer.from(guardado, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
