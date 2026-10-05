// ============================================
// Señales de cada conversación y resumen de 30 días
// ============================================
// Sin IA ni coste extra: palabras clave sobre lo que ya se guarda.

import type { Conversacion, Registro } from './datos';

/** El asistente reconoce que la ficha no tiene la respuesta. */
const SIN_RESPUESTA = new RegExp(
  [
    'no (tengo|dispongo de|cuento con) (ese|esa|este|esta|el|la|los|las)? ?(dato|datos|informaci[oó]n)',
    'no (aparece|figura|consta|viene) en (mi|la|esta) (informaci[oó]n|ficha)',
    'no tengo constancia',
    'no (lo )?s[eé] (con seguridad|exactamente|decirte)',
    'no sabr[ií]a (decirte|decirle)',
    'no puedo confirmarte',
  ].join('|'),
  'i'
);

export function sinRespuesta(respuesta: string): boolean {
  return SIN_RESPUESTA.test(respuesta);
}

type Tema = { nombre: string; claves: RegExp };

// El orden importa: gana el primer tema que encaja.
const TEMAS: Record<'negocio' | 'ayuntamiento', Tema[]> = {
  negocio: [
    { nombre: 'Precios y pagos', claves: /precio|cu[aá]nto (cuesta|vale|sale)|tarifa|euros|€|pagar|plazos|financia|oferta|descuento|matr[ií]cula cuesta/i },
    { nombre: 'Citas y clase de prueba', claves: /cita|clase de prueba|reserv|hueco|quedar|ir a veros|pasarme/i },
    { nombre: 'Apuntarse', claves: /apunt|inscrib|matricul|empezar|plaza|grupo nuevo/i },
    { nombre: 'Horarios', claves: /horario|\bhoras?\b|abr[ií]s|cerr[aá]is|s[aá]bado|domingo|agosto|vacaciones|festivo/i },
    { nombre: 'Exámenes y prácticas', claves: /examen|te[oó]ric|pr[aá]ctic|dgt|test|aprob|suspen|clase/i },
    { nombre: 'Ubicación', claves: /d[oó]nde|direcci[oó]n|calle|llegar|aparcar|metro|autob[uú]s|sede/i },
    { nombre: 'Permisos y cursos', claves: /permiso|carnet|carn[eé]|curso|moto|cami[oó]n|\bb\b|\ba2\b|cap\b/i },
  ],
  ayuntamiento: [
    { nombre: 'Incidencias', claves: /farola|bache|basura|contenedor|ruido|aver[ií]a|rot[oa]|fuga|limpieza|incidencia/i },
    { nombre: 'Horarios y oficinas', claves: /horario|\bhoras?\b|abre|cierra|oficina|atenci[oó]n/i },
    { nombre: 'Trámites', claves: /empadron|certificado|licencia|tr[aá]mite|sede|registro|cita previa|solicitud|impuesto|ibi|tasa|multa/i },
    { nombre: 'Fiestas y cultura', claves: /fiesta|feria|evento|concierto|biblioteca|cultura|teatro|museo/i },
    { nombre: 'Servicios', claves: /piscina|polideportivo|deporte|colegio|escuela|m[eé]dico|centro de salud|farmacia|autob[uú]s|taxi/i },
    { nombre: 'Ubicación', claves: /d[oó]nde|direcci[oó]n|calle|llegar|aparcar/i },
  ],
};

export function temaDe(pregunta: string | null, tipo: 'negocio' | 'ayuntamiento'): string {
  if (!pregunta) return 'Otros';
  return TEMAS[tipo].find((t) => t.claves.test(pregunta))?.nombre ?? 'Otros';
}

export type Resumen = {
  conversaciones: number;
  porCanal: { web: number; whatsapp: number };
  citas: number;
  registros: number;
  pendientes: number;
  sinRespuesta: number;
  /** Fuera del horario de atención aproximado (antes de las 9, desde las 20 o en fin de semana). */
  fueraDeHorario: number;
  temas: { nombre: string; total: number }[];
  preguntasSinRespuesta: { id: string; pregunta: string; cuando: string }[];
};

const partes = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'Europe/Madrid',
  weekday: 'short',
  hour: 'numeric',
  hourCycle: 'h23',
});

/** Cuándo escribió el cliente, en hora de España: fin de semana o fuera de 9 a 20. */
export function fueraDeHorario(iso: string): boolean {
  const p = partes.formatToParts(new Date(iso));
  const dia = p.find((x) => x.type === 'weekday')?.value ?? '';
  const hora = Number(p.find((x) => x.type === 'hour')?.value ?? 12);
  return /^(s[aá]b|dom)/i.test(dia) || hora < 9 || hora >= 20;
}

export function resumir(
  conversaciones: Conversacion[],
  registros: Registro[],
  citas: number,
  tipo: 'negocio' | 'ayuntamiento'
): Resumen {
  const temas = new Map<string, number>();
  for (const c of conversaciones) {
    const t = temaDe(c.primera ?? c.ultima, tipo);
    temas.set(t, (temas.get(t) ?? 0) + 1);
  }
  return {
    conversaciones: conversaciones.length,
    porCanal: {
      web: conversaciones.filter((c) => c.canal === 'web').length,
      whatsapp: conversaciones.filter((c) => c.canal === 'whatsapp').length,
    },
    citas,
    registros: registros.length,
    pendientes: registros.filter((r) => r.estado === 'pendiente').length,
    sinRespuesta: conversaciones.filter((c) => c.sin_respuesta).length,
    fueraDeHorario: conversaciones.filter((c) => fueraDeHorario(c.creada)).length,
    temas: [...temas.entries()]
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total || (a.nombre === 'Otros' ? 1 : b.nombre === 'Otros' ? -1 : 0)),
    preguntasSinRespuesta: conversaciones
      .filter((c) => c.sin_respuesta)
      .map((c) => ({ id: c.id, pregunta: c.pregunta_sin_respuesta ?? c.ultima ?? '', cuando: c.actualizada }))
      .filter((p) => p.pregunta)
      .slice(0, 15),
  };
}
