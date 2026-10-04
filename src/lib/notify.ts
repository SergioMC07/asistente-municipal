// ============================================
// Avisos al comercial cuando alguien prueba una demo
// ============================================
// Si NOTIFY_URL apunta a un tema de ntfy (https://ntfy.sh/<tema-secreto>),
// llega una notificación al móvil cuando alguien abre una demo o escribe
// su primer mensaje. Así se sabe cuándo llamar al ayuntamiento.

const BOT_UA =
  /bot|crawler|spider|preview|whatsapp|facebookexternalhit|telegram|slack|discord|linkedin|twitter|vercel|headless/i;

/** Las vistas previas de enlaces (WhatsApp, correo…) no son visitas reales. */
export function isRealVisitor(userAgent: string | null): boolean {
  return !!userAgent && !BOT_UA.test(userAgent);
}

export async function notify(title: string, message: string): Promise<void> {
  const url = process.env.NOTIFY_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      // ntfy recibe el título en una cabecera: sin tildes por compatibilidad.
      headers: { Title: title.normalize('NFD').replace(/[̀-ͯ]/g, ''), Tags: 'speech_balloon' },
      body: message.slice(0, 500),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // Un aviso que falla nunca debe romper la demo.
  }
}
