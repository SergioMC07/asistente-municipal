// ============================================
// Textos que cambian entre un ayuntamiento y un negocio
// ============================================
// El asistente es el mismo; cambia a quién atiende y qué recoge:
// incidencias en la calle (ayuntamiento) o solicitudes de clientes (negocio).

import type { Pueblo } from '@/lib/pueblo';

export type Clase = 'incidencia' | 'solicitud';

export type Textos = {
  tipo: Pueblo['tipo'];
  /** "Ayuntamiento de Chinchón" o "Autoescuela Zebra". */
  titulo: string;
  /** A quién atiende, en plural: "vecinos" o "alumnos". */
  publico: string;
  saludo: string;
  /** "la web municipal" o "su web". */
  fuente: string;
  /** Qué recoge el asistente: incidencias o solicitudes. */
  clase: Clase;
  /** Pista para probar en el panel cuando aún no hay ninguna. */
  ejemplo: string;
};

type Entidad = Pick<Pueblo, 'tipo' | 'nombre' | 'sector' | 'saludo'>;

export function textos(e: Entidad): Textos {
  if (e.tipo === 'negocio') {
    return {
      tipo: 'negocio',
      titulo: e.nombre,
      publico: 'alumnos',
      saludo:
        e.saludo ??
        `¡Hola! Soy el asistente de **${e.nombre}** y te atiendo a cualquier hora.\n\nPregúntame por precios, horarios o cómo apuntarte, y si quieres te ayudo a pedir información.`,
      fuente: 'su web',
      clase: 'solicitud',
      ejemplo: '«Quiero apuntarme, ¿puedo empezar el lunes por la tarde?»',
    };
  }
  return {
    tipo: 'ayuntamiento',
    titulo: `Ayuntamiento de ${e.nombre}`,
    publico: 'vecinos',
    saludo: `¡Hola! Soy el asistente del **Ayuntamiento de ${e.nombre}** y te atiendo a cualquier hora.\n\nPregúntame por horarios, trámites, servicios o fiestas, o avísame de una incidencia en la calle.`,
    fuente: 'la web municipal',
    clase: 'incidencia',
    ejemplo: '«Hay una farola fundida en la calle Mayor»',
  };
}
