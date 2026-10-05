import { describe, expect, it } from 'vitest';
import { extractIncidencias, splitIncidencias } from '@/lib/incidencia';
import { MemoryPanel, type Turno } from './datos';
import { csv } from './excel';
import { cuando } from './formato';
import { fueraDeHorario, resumir, sinRespuesta, temaDe } from './resumen';
import { DURACION_ENLACE, DURACION_SESION, calendarioValido, firmar, leer, tokenAcceso, tokenCalendario, tokenSesion } from './sesion';

describe('acceso al panel', () => {
  const ahora = Date.parse('2026-10-05T10:00:00Z');

  it('el enlace vale 15 minutos y solo como enlace', () => {
    const t = tokenAcceso(' Dueña@Centro.es ', ahora);
    expect(leer(t, 'acceso', ahora)?.email).toBe('dueña@centro.es');
    expect(leer(t, 'acceso', ahora + DURACION_ENLACE + 1)).toBeNull();
    expect(leer(t, 'sesion', ahora)).toBeNull();
  });

  it('la sesión dura 30 días', () => {
    const t = tokenSesion('a@b.es', ahora);
    expect(leer(t, 'sesion', ahora + DURACION_SESION - 1)?.email).toBe('a@b.es');
    expect(leer(t, 'sesion', ahora + DURACION_SESION + 1)).toBeNull();
  });

  it('el calendario de un negocio no abre el de otro', () => {
    expect(calendarioValido('a', tokenCalendario('a'))).toBe(true);
    expect(calendarioValido('b', tokenCalendario('a'))).toBe(false);
    expect(calendarioValido('a', null)).toBe(false);
  });

  it('rechaza un token manipulado', () => {
    const t = tokenSesion('a@b.es', ahora);
    const [, firma] = t.split('.');
    const otro = Buffer.from(JSON.stringify({ tipo: 'sesion', email: 'intruso@x.es', exp: ahora + 1e9 })).toString(
      'base64url'
    );
    expect(leer(`${otro}.${firma}`, 'sesion', ahora)).toBeNull();
    expect(leer(`${t}x`, 'sesion', ahora)).toBeNull();
    expect(leer('basura', 'sesion', ahora)).toBeNull();
    expect(leer(firmar({ tipo: 'sesion', email: 'a@b.es', exp: ahora - 1 }), 'sesion', ahora)).toBeNull();
  });
});

describe('conversaciones guardadas', () => {
  const turno = (p: Partial<Turno>): Turno => ({
    slug: 'centro',
    conversacionId: '11111111-1111-4111-8111-111111111111',
    canal: 'web',
    esPrimera: false,
    usuario: 'Hola',
    respuesta: 'Hola, ¿en qué te ayudo?',
    senales: { cita: false, registro: false, sinRespuesta: false },
    ahora: new Date('2026-10-05T10:00:00Z'),
    ...p,
  });

  it('las señales se acumulan y la primera pregunta no cambia', async () => {
    const store = new MemoryPanel();
    await store.guardarTurno(turno({ esPrimera: true, usuario: '¿Cuánto cuesta el B?' }));
    await store.guardarTurno(
      turno({
        usuario: '¿Abrís en agosto?',
        senales: { cita: false, registro: false, sinRespuesta: true },
        ahora: new Date('2026-10-05T10:01:00Z'),
      })
    );
    await store.guardarTurno(
      turno({
        usuario: 'Quiero cita el lunes',
        nombre: 'Lucía',
        senales: { cita: true, registro: false, sinRespuesta: false },
        ahora: new Date('2026-10-05T10:02:00Z'),
      })
    );
    const [c] = await store.conversaciones('centro', new Date('2026-10-01T00:00:00Z'));
    expect(c).toMatchObject({
      primera: '¿Cuánto cuesta el B?',
      ultima: 'Quiero cita el lunes',
      nombre: 'Lucía',
      tiene_cita: true,
      sin_respuesta: true,
      pregunta_sin_respuesta: '¿Abrís en agosto?',
      mensajes: 6,
    });
    expect(await store.conversaciones('otro', new Date(0))).toHaveLength(0);
    expect(await store.conversacion('otro', c.id)).toBeNull();
  });

  it('marca una solicitud como hecha solo en su negocio', async () => {
    const store = new MemoryPanel();
    const r = await store.registrar({
      slug: 'centro',
      conversacion_id: null,
      clase: 'solicitud',
      tipo: 'Permiso B',
      lugar: 'Tardes',
      detalle: '',
      nombre: 'Lucía',
      telefono: '612 345 678',
    });
    expect(await store.marcarRegistro('otro', r.id, 'hecho')).toBe(false);
    expect(await store.marcarRegistro('centro', r.id, 'hecho')).toBe(true);
    expect((await store.registros('centro', new Date(0)))[0].estado).toBe('hecho');
  });
});

describe('solicitudes con nombre y teléfono', () => {
  it('lee las de 5 campos y las de 3', () => {
    const texto =
      'Hecho.\n[[SOLICITUD: Permiso B | Tardes | Empezar en noviembre | Lucía Pérez | 612 345 678]]\n[[SOLICITUD: Clase de prueba | Lunes | -]]';
    const [a, b] = extractIncidencias(texto);
    expect(a).toMatchObject({ tipo: 'Permiso B', detalle: 'Empezar en noviembre', nombre: 'Lucía Pérez', telefono: '612 345 678' });
    expect(b.nombre).toBeUndefined();
    expect(splitIncidencias(texto).filter((s) => s.kind === 'incidencia')).toHaveLength(2);
  });
});

describe('resumen', () => {
  it('detecta cuándo no supo responder', () => {
    expect(sinRespuesta('No tengo esa información, llama al centro.')).toBe(true);
    expect(sinRespuesta('Ese dato no aparece en mi información.')).toBe(true);
    expect(sinRespuesta('El permiso B cuesta **650 €**.')).toBe(false);
  });

  it('clasifica por temas', () => {
    expect(temaDe('¿Cuánto cuesta el carnet?', 'negocio')).toBe('Precios y pagos');
    expect(temaDe('¿Qué horario tenéis?', 'negocio')).toBe('Horarios');
    expect(temaDe('Quiero una clase de prueba', 'negocio')).toBe('Citas y clase de prueba');
    expect(temaDe('Hay una farola fundida', 'ayuntamiento')).toBe('Incidencias');
    expect(temaDe('hola', 'negocio')).toBe('Otros');
  });

  it('cuenta lo de fuera de horario en hora de España', () => {
    expect(fueraDeHorario('2026-10-05T19:30:00Z')).toBe(true); // lunes 21:30
    expect(fueraDeHorario('2026-10-05T09:00:00Z')).toBe(false); // lunes 11:00
    expect(fueraDeHorario('2026-10-04T10:00:00Z')).toBe(true); // domingo
  });

  it('resume conversaciones y registros', () => {
    const base = {
      slug: 'c',
      canal: 'web' as const,
      cliente: null,
      nombre: null,
      ultima: null,
      tiene_cita: false,
      tiene_registro: false,
      creada: '2026-10-05T09:00:00Z',
      actualizada: '2026-10-05T09:00:00Z',
      mensajes: 2,
    };
    const r = resumir(
      [
        { ...base, id: '1', primera: '¿Precio del B?', sin_respuesta: false, pregunta_sin_respuesta: null },
        { ...base, id: '2', primera: '¿Cuánto vale la moto?', sin_respuesta: true, pregunta_sin_respuesta: '¿Hay descuento?' },
      ],
      [],
      1,
      'negocio'
    );
    expect(r).toMatchObject({ conversaciones: 2, citas: 1, sinRespuesta: 1, temas: [{ nombre: 'Precios y pagos', total: 2 }] });
    expect(r.preguntasSinRespuesta[0].pregunta).toBe('¿Hay descuento?');
  });
});

describe('Excel y fechas', () => {
  it('genera un CSV que Excel en español abre bien', () => {
    const texto = csv(['A', 'B'], [['uno; dos', 'dice "hola"'], [null, 3]]);
    expect(texto.startsWith('﻿A;B\r\n')).toBe(true);
    expect(texto).toContain('"uno; dos";"dice ""hola"""\r\n');
    expect(texto).toContain(';3\r\n');
  });

  it('dice cuándo fue en hora de España', () => {
    const ahora = new Date('2026-10-05T10:00:00Z');
    expect(cuando('2026-10-05T07:15:00Z', ahora)).toBe('09:15');
    expect(cuando('2026-10-04T18:00:00Z', ahora)).toBe('Ayer, 20:00');
  });
});
