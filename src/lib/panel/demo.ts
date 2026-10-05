// ============================================
// Panel de demostración con datos de ejemplo
// ============================================
// Para enseñar el panel a un negocio antes de contratar: conversaciones,
// citas y solicitudes inventadas pero verosímiles, con su nombre, su color y
// su agenda. Se generan al vuelo (nada se guarda) y la interfaz avisa de que
// son de ejemplo. Las respuestas no inventan precios: usan los datos de la
// ficha (horario, teléfono, web) o remiten al centro.

import type { Pueblo } from '@/lib/pueblo';
import { etiquetaHueco, fechaMadrid, huecosLibres } from '@/lib/citas/agenda';
import type { DatosAgenda } from '@/lib/citas/vista';
import { MemoryPanel } from './datos';

type Ejemplo = {
  /** Hace cuántas horas empezó. */
  hace: number;
  nombre?: string;
  telefono?: string;
  turnos: [string, string][];
  /** Índice del hueco libre que se convierte en su cita. */
  cita?: number;
  registro?: { tipo: string; lugar: string; detalle: string; hecho?: boolean };
  sinRespuesta?: boolean;
};

const TEL = (n: number) => `600 000 ${String(100 + n).padStart(3, '0')}`;

function ejemplos(p: Pueblo): Ejemplo[] {
  const horario = p.horario ? `El horario es **${p.horario}**.` : 'Tienes el horario en la web.';
  const llamar = p.telefono ? `llama al **${p.telefono}**` : 'contacta con el centro';

  if (p.tipo !== 'negocio') {
    return [
      { hace: 2, turnos: [['Hay una farola apagada en la calle Mayor, frente al 12', 'Gracias por avisar.\n[[INCIDENCIA: Farola apagada | Calle Mayor, 12 | No se enciende por la noche]]\nLa he registrado para el servicio municipal.']], registro: { tipo: 'Farola apagada', lugar: 'Calle Mayor, 12', detalle: 'No se enciende por la noche' } },
      { hace: 9, turnos: [['¿A qué hora abre el ayuntamiento?', `${horario} Si vas a hacer un trámite, lleva tu DNI.`]] },
      { hace: 21, nombre: 'Rosa', telefono: TEL(1), cita: 2, turnos: [['Quiero cita para empadronarme', 'Claro. Tengo estos huecos libres. ¿Cuál te viene mejor?'], ['El primero. Soy Rosa, ' + TEL(1), 'Hecho, te espero.']] },
      { hace: 30, turnos: [['¿Cuándo son las fiestas este año?', 'Las fechas exactas del programa todavía no aparecen en mi información. Te aconsejo consultar la web municipal o ' + llamar + '.']], sinRespuesta: true },
      { hace: 46, turnos: [['El contenedor de la plaza está desbordado', 'Gracias por avisar.\n[[INCIDENCIA: Contenedor desbordado | Plaza del pueblo | Basura fuera del contenedor]]\nLa he registrado.']], registro: { tipo: 'Contenedor desbordado', lugar: 'Plaza del pueblo', detalle: 'Basura fuera del contenedor', hecho: true } },
      { hace: 70, turnos: [['¿Cómo pido un certificado de empadronamiento?', 'Puedes pedirlo en la sede electrónica con certificado digital o en persona en el ayuntamiento. ' + horario]] },
      { hace: 95, turnos: [['¿La piscina municipal abre en septiembre?', 'No tengo esa información. Para confirmarlo, ' + llamar + '.']], sinRespuesta: true },
      { hace: 120, nombre: 'Andrés', telefono: TEL(2), cita: 9, turnos: [['Necesito cita previa para una licencia de obra menor', 'Te propongo estos huecos.'], ['Me va bien, soy Andrés, ' + TEL(2), 'Listo, cita reservada.']] },
      { hace: 150, turnos: [['Hay un bache grande en el camino del cementerio', 'Gracias.\n[[INCIDENCIA: Bache | Camino del cementerio | Bache grande en la calzada]]\nQueda registrada.']], registro: { tipo: 'Bache', lugar: 'Camino del cementerio', detalle: 'Bache grande en la calzada', hecho: true } },
      { hace: 190, turnos: [['¿Qué día pasa la recogida de muebles?', 'No tengo información sobre la recogida de muebles. Para consultarlo, ' + llamar + '.']], sinRespuesta: true },
    ];
  }

  const academia = /academ|idioma|ingl/i.test(p.sector ?? '');
  if (academia) {
    return [
      { hace: 1.5, nombre: 'Lucía', telefono: TEL(1), turnos: [['¿Tenéis clases para preparar el B2 de Cambridge?', 'Sí, preparamos los exámenes oficiales de Cambridge. ¿Quieres que te llamen para hacer una prueba de nivel?'], ['Sí, por favor. Lucía, ' + TEL(1) + ', mejor por las tardes', '¡Perfecto!\n[[SOLICITUD: Preparación B2 Cambridge | Por las tardes | Quiere prueba de nivel | Lucía | ' + TEL(1) + ']]\nTe llamarán lo antes posible.']], registro: { tipo: 'Preparación B2 Cambridge', lugar: 'Por las tardes', detalle: 'Quiere prueba de nivel' } },
      { hace: 8, turnos: [['¿Qué horario tenéis?', horario]] },
      { hace: 14, turnos: [['¿Cuánto cuesta al mes?', 'Los precios dependen del grupo y del número de horas. Para darte el precio exacto, ' + llamar + ' o déjame tus datos y te llaman.']] },
      { hace: 26, turnos: [['¿Hacéis clases de chino?', 'No tengo esa información. Para confirmarlo, ' + llamar + '.']], sinRespuesta: true },
      { hace: 40, nombre: 'Javier', telefono: TEL(2), turnos: [['Mi hijo tiene 9 años, ¿tenéis grupos de niños?', 'Sí, hay grupos por edades. ¿Quieres que te llamen para ver horarios?'], ['Vale, soy Javier, ' + TEL(2), 'Hecho.\n[[SOLICITUD: Grupo de niños | Cualquier tarde | Hijo de 9 años | Javier | ' + TEL(2) + ']]']], registro: { tipo: 'Grupo de niños', lugar: 'Cualquier tarde', detalle: 'Hijo de 9 años', hecho: true } },
      { hace: 64, turnos: [['¿Dónde estáis?', `Tienes la dirección y cómo llegar en ${p.web}.`]] },
      { hace: 88, turnos: [['¿Hay clases en agosto?', 'No tengo esa información. Para confirmarlo, ' + llamar + '.']], sinRespuesta: true },
      { hace: 130, turnos: [['¿Las clases son presenciales u online?', 'Te lo confirman en el centro; si quieres, te dejo una solicitud para que te llamen.']] },
    ];
  }

  return [
    { hace: 1.5, nombre: 'Laura', telefono: TEL(1), cita: 1, turnos: [['¿Qué incluye el carnet de coche?', 'El **permiso B** incluye la matrícula, el teórico y las prácticas. Si quieres, te reservo una cita y te lo explican en persona.'], ['Vale, ¿tenéis hueco? Me llamo Laura, ' + TEL(1), '¡Hecho!']] },
    { hace: 7, turnos: [['¿Qué horario tiene la oficina?', horario]] },
    { hace: 13, nombre: 'Carlos', telefono: TEL(2), turnos: [['Quiero apuntarme al teórico, ¿me llamáis?', 'Claro. ¿Me dices tu nombre y un teléfono?'], ['Carlos, ' + TEL(2) + ', mejor por las mañanas', '¡Perfecto!\n[[SOLICITUD: Permiso B | Por las mañanas | Quiere empezar el teórico | Carlos | ' + TEL(2) + ']]\nTe llamarán lo antes posible.']], registro: { tipo: 'Permiso B', lugar: 'Por las mañanas', detalle: 'Quiere empezar el teórico' } },
    { hace: 22, turnos: [['¿Las prácticas se pueden hacer con coche automático?', 'No tengo esa información. Para confirmarlo, ' + llamar + '.']], sinRespuesta: true },
    { hace: 33, turnos: [['¿Cuánto cuesta cada clase práctica?', 'El precio de las prácticas te lo confirman en el centro: ' + llamar + ' o déjame tus datos y te llaman.']] },
    { hace: 49, nombre: 'Marta', telefono: TEL(3), turnos: [['Mi hija quiere sacarse el carnet en verano', 'Genial. ¿Me dejas un nombre y un teléfono para que os llamen?'], ['Marta, ' + TEL(3), 'Hecho.\n[[SOLICITUD: Permiso B en verano | Julio | Para su hija | Marta | ' + TEL(3) + ']]']], registro: { tipo: 'Permiso B en verano', lugar: 'Julio', detalle: 'Para su hija', hecho: true } },
    { hace: 72, nombre: 'Daniel', telefono: TEL(4), cita: 6, turnos: [['Quiero ir a informarme de la moto', 'Te propongo estos huecos.'], ['El segundo. Soy Daniel, ' + TEL(4), 'Listo, te esperamos.']] },
    { hace: 98, turnos: [['¿Dónde estáis?', `Tienes la dirección y cómo llegar en ${p.web}.`]] },
    { hace: 124, turnos: [['¿Hacéis el curso para el camión C?', 'No tengo esa información. Para confirmarlo, ' + llamar + '.']], sinRespuesta: true },
    { hace: 160, turnos: [['Después de aprobar el práctico, ¿cuándo puedo conducir?', 'En cuanto apruebas te dan un permiso provisional y puedes conducir ese mismo día, con la **L** durante el primer año.']] },
    { hace: 200, nombre: 'Irene', telefono: TEL(5), cita: 12, turnos: [['¿Puedo pasarme a matricularme?', 'Claro, te reservo una cita.'], ['Irene, ' + TEL(5), 'Hecho.']] },
  ];
}

const uuid = (i: number) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`;

/** Citas de ejemplo: huecos reales de su agenda, a nombre de los clientes de ejemplo. */
function citasEjemplo(p: Pueblo, ahora: Date) {
  const agenda = p.citas;
  if (!agenda) return [];
  const futuros = huecosLibres(agenda, ahora);
  return ejemplos(p)
    .map((e, n) => ({ e, n }))
    .filter(({ e }) => e.cita !== undefined && e.nombre && e.telefono)
    .map(({ e, n }, i) => {
      const h = futuros[Math.min(e.cita! * 4, futuros.length - 1)];
      // `n` es la posición del ejemplo: une la cita con su conversación.
      return h ? { e, n, h, id: `C${i + 1}` } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
}

export function panelDemo(p: Pueblo, ahora = new Date()): MemoryPanel {
  const store = new MemoryPanel();
  const citas = citasEjemplo(p, ahora);
  const tipoCita = p.citas?.tipos[0] ?? 'Cita';
  const lugar = (p.citas?.lugar ?? '').replace(/[|\]\[]/g, '/');

  ejemplos(p).forEach((e, i) => {
    const id = uuid(i);
    const inicio = ahora.getTime() - e.hace * 3_600_000;
    e.turnos.forEach(([usuario, respuesta], t) => {
      let texto = respuesta;
      const ultimo = t === e.turnos.length - 1;
      const cita = citas.find((c) => c.n === i);
      if (ultimo && cita) {
        const fin = new Date(new Date(cita.h.inicio).getTime() + (p.citas?.duracion ?? 15) * 60_000).toISOString();
        texto = `${respuesta}\n[[CITA: ${cita.id} | ${tipoCita} | ${cita.h.inicio} | ${fin} | ${lugar} | ${e.nombre} | real]]`;
      }
      store.guardarTurno({
        slug: p.slug,
        conversacionId: id,
        canal: 'web',
        nombre: ultimo ? (e.nombre ?? null) : null,
        esPrimera: t === 0,
        usuario,
        respuesta: texto,
        senales: {
          cita: ultimo && !!cita,
          registro: ultimo && !!e.registro,
          sinRespuesta: !!e.sinRespuesta,
        },
        ahora: new Date(inicio + t * 90_000),
      });
    });
    if (e.registro) {
      store.regs.push({
        id: `r${i + 1}`,
        slug: p.slug,
        conversacion_id: id,
        clase: p.tipo === 'negocio' ? 'solicitud' : 'incidencia',
        tipo: e.registro.tipo,
        lugar: e.registro.lugar,
        detalle: e.registro.detalle,
        nombre: e.nombre ?? null,
        telefono: e.telefono ?? null,
        estado: e.registro.hecho ? 'hecho' : 'pendiente',
        creado: new Date(inicio + (e.turnos.length - 1) * 90_000 + 1).toISOString(),
      });
    }
  });
  return store;
}

/** La agenda de ejemplo con el mismo formato que la real. */
export function agendaDemo(p: Pueblo, ahora = new Date()): DatosAgenda {
  const agenda = p.citas;
  if (!agenda) return { estado: 'sin-agenda' };
  const citas = citasEjemplo(p, ahora).map(({ e, h, id }) => ({
    id,
    tipo: agenda.tipos[0],
    inicio: h.inicio,
    nombre: e.nombre!,
    telefono: e.telefono!,
    nota: null,
    origen: 'asistente' as const,
    etiqueta: etiquetaHueco(new Date(h.inicio)),
    dia: fechaMadrid(new Date(h.inicio)).fecha,
  }));
  const ocupados = citas.map((c) => ({ inicio: c.inicio }));
  return {
    estado: 'real',
    hoy: fechaMadrid(ahora).fecha,
    citas: citas.sort((a, b) => a.inicio.localeCompare(b.inicio)),
    bloqueos: [],
    libres: huecosLibres(agenda, ahora)
      .filter((h) => !ocupados.some((o) => o.inicio === h.inicio))
      .map(({ fecha, hora, etiqueta }) => ({ fecha, hora, etiqueta })),
  };
}
