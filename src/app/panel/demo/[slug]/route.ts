// Entrada al panel de demostración de una demo: /panel/demo/<slug>.
// Deja una cookie con el slug y abre su panel con datos de ejemplo.

import { NextResponse } from 'next/server';
import { COOKIE_DEMO } from '@/lib/panel/sesion';
import { getPueblo } from '@/lib/pueblo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const origen = new URL(req.url).origin;
  const pueblo = await getPueblo(params.slug);
  // Las fichas con panel son clientes reales: su panel solo se abre con su email.
  if (!pueblo || pueblo.panel) return NextResponse.redirect(new URL('/panel/entrar', origen));
  const res = NextResponse.redirect(new URL(`/panel/${pueblo.slug}`, origen));
  res.cookies.set(COOKIE_DEMO, pueblo.slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
  return res;
}
