// ============================================
// Archivos de calendario (.ics): sirven para Google, Outlook y Apple
// ============================================

export type Evento = {
  uid: string;
  inicio: string;
  fin: string;
  titulo: string;
  lugar?: string;
  descripcion?: string;
};

const fecha = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const escapar = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

function vevent(e: Evento, ahora: string): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${e.uid}@atiende`,
    `DTSTAMP:${fecha(ahora)}`,
    `DTSTART:${fecha(e.inicio)}`,
    `DTEND:${fecha(e.fin)}`,
    `SUMMARY:${escapar(e.titulo)}`,
    ...(e.lugar ? [`LOCATION:${escapar(e.lugar)}`] : []),
    ...(e.descripcion ? [`DESCRIPTION:${escapar(e.descripcion)}`] : []),
    'END:VEVENT',
  ];
}

/** Calendario con uno o varios eventos, en formato iCalendar. */
export function ics(eventos: Evento[], nombre?: string, ahora = new Date().toISOString()): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Atiende//Citas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(nombre ? [`X-WR-CALNAME:${escapar(nombre)}`] : []),
    ...eventos.flatMap((e) => vevent(e, ahora)),
    'END:VCALENDAR',
  ].join('\r\n');
}
