// Enlaces de contacto comercial y de prueba en WhatsApp.

export type ContactConfig = {
  email?: string;
  /** Número de WhatsApp del comercial, con prefijo de país (p. ej. 34600111222). */
  whatsapp?: string;
  /** Número de WhatsApp donde está el asistente de demostración. */
  whatsappDemo?: string;
};

/** WhatsApp comercial por defecto. La variable de entorno, si existe, tiene prioridad. */
export const DEFAULT_CONTACT_WHATSAPP = '34638798445';

export function contactWhatsapp(): string {
  return process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.trim() || DEFAULT_CONTACT_WHATSAPP;
}

/** "34638798445" → "+34 638 79 84 45" para mostrarlo a una persona. */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  const m = d.match(/^34(\d{3})(\d{2})(\d{2})(\d{2})$/);
  return m ? `+34 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : `+${d}`;
}

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

/** Enlace de la landing para pedir la demo de un municipio o de un negocio. */
export function requestDemoLink(cfg: ContactConfig, para: 'municipio' | 'negocio' = 'municipio'): string | null {
  const text = `Hola, me gustaría ver la demo de Atiende con mi ${para}: `;
  if (cfg.whatsapp && digits(cfg.whatsapp).length >= 9) return waLink(cfg.whatsapp, text);
  if (cfg.email) {
    return `mailto:${cfg.email}?subject=${encodeURIComponent(`Demo de Atiende para mi ${para}`)}&body=${encodeURIComponent(text)}`;
  }
  return null;
}

/** Enlace que abre el asistente de demo en WhatsApp con el pueblo ya escrito. */
export function demoWhatsappLink(cfg: ContactConfig, nombre: string): string | null {
  if (!cfg.whatsappDemo || digits(cfg.whatsappDemo).length < 9) return null;
  return waLink(cfg.whatsappDemo, `Hola ${nombre}`);
}
