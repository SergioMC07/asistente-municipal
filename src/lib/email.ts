// ============================================
// Envío de emails con Resend (RESEND_API_KEY y AVISOS_FROM)
// ============================================

export function emailConfigurado(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.AVISOS_FROM;
}

export async function enviarEmail(email: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.AVISOS_FROM;
  if (!key || !from) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...email, from, to: [email.to] }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error('Resend', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('No se pudo enviar el email:', err);
    return false;
  }
}

export const escHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
