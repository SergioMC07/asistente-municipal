// ============================================
// Acceso al panel: enlace por email y sesión firmada
// ============================================
// Sin contraseñas ni tabla de usuarios: el email recibe un enlace firmado
// (15 minutos) y al abrirlo queda una cookie firmada (30 días). Qué negocios
// puede ver se consulta en las fichas en cada petición, así que quitar un
// email de la ficha le quita el acceso al momento.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { listarPueblos, type Pueblo } from '@/lib/pueblo';

export const COOKIE = 'atiende_panel';
export const DURACION_ENLACE = 15 * 60 * 1000;
export const DURACION_SESION = 30 * 24 * 60 * 60 * 1000;

type Datos = { tipo: 'acceso' | 'sesion'; email: string; exp: number };

function secreto(): string {
  const s = process.env.PANEL_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV !== 'production') return 'solo-para-desarrollo-no-usar-en-produccion-000';
  throw new Error('Falta PANEL_SECRET (32 caracteres o más) en las variables de entorno.');
}

const hmac = (texto: string) => createHmac('sha256', secreto()).update(texto).digest();

export function firmar(datos: Datos): string {
  const cuerpo = Buffer.from(JSON.stringify(datos)).toString('base64url');
  return `${cuerpo}.${hmac(cuerpo).toString('base64url')}`;
}

export function leer(token: string | undefined | null, tipo: Datos['tipo'], ahora = Date.now()): Datos | null {
  if (!token) return null;
  const [cuerpo, firma] = token.split('.');
  if (!cuerpo || !firma) return null;
  const esperada = hmac(cuerpo);
  const recibida = Buffer.from(firma, 'base64url');
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  try {
    const datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString()) as Datos;
    return datos.tipo === tipo && datos.exp > ahora ? datos : null;
  } catch {
    return null;
  }
}

export const tokenAcceso = (email: string, ahora = Date.now()) =>
  firmar({ tipo: 'acceso', email: email.trim().toLowerCase(), exp: ahora + DURACION_ENLACE });

export const tokenSesion = (email: string, ahora = Date.now()) =>
  firmar({ tipo: 'sesion', email, exp: ahora + DURACION_SESION });

/** Token del calendario suscribible de un negocio: estable y sin guardar nada. */
export const tokenCalendario = (slug: string) => hmac(`calendario:${slug}`).toString('base64url').slice(0, 32);

/** Comprueba el token del calendario sin filtrar tiempos; sin PANEL_SECRET, nunca vale. */
export function calendarioValido(slug: string, token: string | null): boolean {
  if (!token) return false;
  try {
    const a = Buffer.from(tokenCalendario(slug));
    const b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function negociosDe(email: string): Promise<Pueblo[]> {
  const e = email.trim().toLowerCase();
  return (await listarPueblos()).filter((p) => p.panel?.emails.includes(e));
}

/** Sesión del panel en el servidor (componentes y rutas). */
export async function sesionActual(): Promise<{ email: string; negocios: Pueblo[] } | null> {
  const datos = leer(cookies().get(COOKIE)?.value, 'sesion');
  if (!datos) return null;
  const negocios = await negociosDe(datos.email);
  return negocios.length ? { email: datos.email, negocios } : null;
}

/** El negocio si la sesión tiene acceso a él; si no, null. */
export async function negocioDeSesion(slug: string): Promise<{ email: string; negocio: Pueblo } | null> {
  const s = await sesionActual();
  const negocio = s?.negocios.find((p) => p.slug === slug);
  return s && negocio ? { email: s.email, negocio } : null;
}
