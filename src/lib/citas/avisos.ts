// ============================================
// Aviso al negocio cuando entra una cita
// ============================================
// Email con Resend (RESEND_API_KEY y AVISOS_FROM) al correo de la agenda, con
// la cita en un .ics adjunto para añadirla a su calendario con un clic.
// Además, si hay NOTIFY_URL, un aviso al móvil del comercial con ntfy.

import type { Pueblo } from '@/lib/pueblo';
import { notify } from '@/lib/notify';
import { etiquetaHueco } from './agenda';
import { ics } from './ics';
import type { Cita } from './store';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export async function avisarCita(pueblo: Pueblo, cita: Cita): Promise<void> {
  const cuando = etiquetaHueco(new Date(cita.inicio));
  const resumen = `${cita.nombre} (${cita.telefono}) · ${cita.tipo} · ${cuando}`;

  await notify(`Nueva cita en ${pueblo.nombre}`, resumen);

  const key = process.env.RESEND_API_KEY;
  const from = process.env.AVISOS_FROM;
  const to = pueblo.citas?.avisoEmail;
  if (!key || !from || !to) return;

  const archivo = ics(
    [
      {
        uid: cita.id,
        inicio: cita.inicio,
        fin: cita.fin,
        titulo: `${cita.tipo}: ${cita.nombre}`,
        lugar: pueblo.citas?.lugar,
        descripcion: `Teléfono: ${cita.telefono}${cita.nota ? `\n${cita.nota}` : ''}\nReservada con el asistente de Atiende.`,
      },
    ],
    pueblo.nombre
  );

  const html = `
    <p>Nueva cita reservada con el asistente:</p>
    <p><strong>${esc(cuando)}</strong><br>
    ${esc(cita.tipo)}<br>
    ${esc(cita.nombre)} · <a href="tel:${esc(cita.telefono.replace(/\s/g, ''))}">${esc(cita.telefono)}</a>
    ${cita.nota ? `<br>${esc(cita.nota)}` : ''}</p>
    <p>El archivo adjunto la añade a tu calendario con un clic.</p>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Nueva cita: ${cita.nombre}, ${cuando}`,
        html,
        attachments: [{ filename: 'cita.ics', content: Buffer.from(archivo).toString('base64') }],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error('Resend', res.status, await res.text());
  } catch (err) {
    // Un aviso que falla no debe romper la reserva: la cita ya está guardada.
    console.error('No se pudo enviar el aviso de cita:', err);
  }
}
