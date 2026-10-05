import { NextResponse } from 'next/server';
import { COOKIE, COOKIE_DEMO } from '@/lib/panel/sesion';

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL('/panel/entrar', new URL(req.url).origin), 303);
  res.cookies.delete(COOKIE);
  res.cookies.delete(COOKIE_DEMO);
  return res;
}
