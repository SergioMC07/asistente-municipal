// ============================================
// Aviso al negocio cuando entra una cita
// ============================================
// Email (Resend) al correo de la agenda, con la cita en un .ics adjunto
// para añadirla a su calendario con un clic.
// Además, si hay NOTIFY_URL, un aviso al móvil del comercial con ntfy.

import type { Pueblo } from '@/lib/pueblo';
import { enviarEmail, escHtml as esc } from '@/lib/email';
import { notify } from '@/lib/notify';
import { etiquetaHueco } from './agenda';
import { ics } from './ics';
import type { Cita } from './store';

export async function avisarCita(pueblo: Pueblo, cita: Cita): Promise<void> {
  const cuando = etiquetaHueco(new Date(cita.inicio));
  const resumen = `${cita.nombre} (${cita.telefono}) · ${cita.tipo} · ${cuando}`;

  await notify(`Nueva cita en ${pueblo.nombre}`, resumen);

  const to = pueblo.citas?.avisoEmail;
  if (!to) return;

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

  await enviarEmail({
    to,
    subject: `Nueva cita: ${cita.nombre}, ${cuando}`,
    html,
    attachments: [{ filename: 'cita.ics', content: Buffer.from(archivo).toString('base64') }],
  });
}
