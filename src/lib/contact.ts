// Enlaces de contacto comercial y de prueba en WhatsApp.

export type ContactConfig = {
  email?: string;
  /** Número de WhatsApp del comercial, con prefijo de país (p. ej. 34600111222). */
  whatsapp?: string;
  /** Número de WhatsApp donde está el asistente de demostración. */
  whatsappDemo?: string;
};

function digits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${digits(phone)}?text=${encodeURIComponent(text)}`;
}

/** Enlace para "Ponerlo en marcha": WhatsApp si lo hay, si no email. */
export function startLink(cfg: ContactConfig, nombre: string): string | null {
  const text = `Hola, he probado la demo del asistente 24 horas para ${nombre} y me gustaría hablar de ponerlo en marcha.`;
  if (cfg.whatsapp && digits(cfg.whatsapp).length >= 9) return waLink(cfg.whatsapp, text);
  if (cfg.email) {
    return `mailto:${cfg.email}?subject=${encodeURIComponent(`Asistente 24 horas · ${nombre}`)}&body=${encodeURIComponent(text)}`;
  }
  return null;
}

/** Enlace que abre el asistente de demo en WhatsApp con el pueblo ya escrito. */
export function demoWhatsappLink(cfg: ContactConfig, nombre: string): string | null {
  if (!cfg.whatsappDemo || digits(cfg.whatsappDemo).length < 9) return null;
  return waLink(cfg.whatsappDemo, `Hola ${nombre}`);
}
