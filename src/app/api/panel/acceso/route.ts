// Pide el enlace de acceso al panel. Siempre responde lo mismo, exista o no
// el email, para no revelar quién es cliente.

import { z } from 'zod';
import { emailConfigurado, enviarEmail, escHtml } from '@/lib/email';
import { negociosDe, tokenAcceso } from '@/lib/panel/sesion';
import { createRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const permitir = createRateLimiter(5, 15 * 60 * 1000);

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!permitir(ip)) return Response.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 });

  const parsed = z.object({ email: z.string().email().max(200) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Escribe un email válido.' }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();

  const negocios = await negociosDe(email);
  if (negocios.length === 0) return Response.json({ ok: true });

  const enlace = `${new URL(req.url).origin}/panel/entrar/verificar?t=${tokenAcceso(email)}`;
  const nombres = negocios.map((n) => n.nombre).join(', ');
  const enviado = await enviarEmail({
    to: email,
    subject: 'Tu enlace para entrar en el panel de Atentia',
    html: `<p>Hola:</p>
      <p>Para entrar en el panel de <strong>${escHtml(nombres)}</strong>, pulsa este enlace. Caduca en 15 minutos.</p>
      <p><a href="${escHtml(enlace)}">Entrar en el panel</a></p>
      <p>Si no lo has pedido tú, ignora este correo.</p>`,
  });

  // En desarrollo, sin Resend, el enlace se devuelve para poder probar.
  if (!enviado && !emailConfigurado() && process.env.NODE_ENV !== 'production') {
    console.log(`Enlace de acceso para ${email}: ${enlace}`);
    return Response.json({ ok: true, enlace });
  }
  return Response.json({ ok: true });
}
