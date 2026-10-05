// Fechas del panel, siempre en hora de España (el servidor está en UTC).

const hora = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' });
const dia = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short' });
const diaSemana = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long' });
const fechaCorta = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' });

export const horaMadrid = (iso: string) => hora.format(new Date(iso));

/** «17:30» hoy, «Ayer, 17:30», «martes, 17:30» esta semana y «3 oct., 17:30» antes. */
export function cuando(iso: string, ahora = new Date()): string {
  const d = new Date(iso);
  const h = hora.format(d);
  const hoy = fechaCorta.format(ahora);
  const ese = fechaCorta.format(d);
  if (ese === hoy) return h;
  const dias = Math.round((Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${ese}T00:00:00Z`)) / 86_400_000);
  if (dias === 1) return `Ayer, ${h}`;
  if (dias > 1 && dias < 7) return `${diaSemana.format(d)}, ${h}`;
  return `${dia.format(d)}, ${h}`;
}

export const hace30 = (ahora = Date.now()) => new Date(ahora - 30 * 86_400_000);
