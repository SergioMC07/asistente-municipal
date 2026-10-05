// Abre el enlace del email: si es válido, deja la sesión y entra al panel.

import { NextResponse } from 'next/server';
import { COOKIE, DURACION_SESION, leer, negociosDe, tokenSesion } from '@/lib/panel/sesion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const datos = leer(url.searchParams.get('t'), 'acceso');
  if (!datos || (await negociosDe(datos.email)).length === 0) {
    return NextResponse.redirect(new URL('/panel/entrar?caducado=1', url.origin));
  }
  const res = NextResponse.redirect(new URL('/panel', url.origin));
  res.cookies.set(COOKIE, tokenSesion(datos.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACION_SESION / 1000,
  });
  return res;
}
