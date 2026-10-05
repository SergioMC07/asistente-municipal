import { describe, expect, it } from 'vitest';
import {
  agendaSchema,
  fechaMadrid,
  huecosLibres,
  madridAUtc,
  ocupadosDeDemo,
  proponerHuecos,
  telefonoValido,
} from './agenda';

const agenda = agendaSchema.parse({
  tipos: ['Información y matrícula'],
  duracion: 30,
  horario: { '1': ['10:00-12:00'], '3': ['10:00-11:00', '17:00-18:00'] },
  antelacion: 120,
  dias: 7,
});

// Lunes 5 de octubre de 2026, 09:00 en Madrid (07:00 UTC, horario de verano).
const lunes9 = new Date('2026-10-05T07:00:00Z');

describe('hora de Madrid', () => {
  it('convierte teniendo en cuenta el horario de verano y de invierno', () => {
    expect(madridAUtc('2026-10-05', '10:00').toISOString()).toBe('2026-10-05T08:00:00.000Z');
    expect(madridAUtc('2026-11-02', '10:00').toISOString()).toBe('2026-11-02T09:00:00.000Z');
    expect(fechaMadrid(new Date('2026-10-25T08:30:00Z'))).toEqual({
      fecha: '2026-10-25',
      hora: '09:30',
      diaSemana: 7,
    });
  });
});

describe('huecosLibres', () => {
  it('genera los huecos del horario y respeta la antelación mínima', () => {
    const huecos = huecosLibres(agenda, lunes9);
    // Lunes: 10:00 y 10:30 quedan a menos de 2 horas; 11:00 y 11:30 sí.
    expect(huecos.filter((h) => h.fecha === '2026-10-05').map((h) => h.hora)).toEqual(['11:00', '11:30']);
    // Miércoles: dos tramos.
    expect(huecos.filter((h) => h.fecha === '2026-10-07').map((h) => h.hora)).toEqual([
      '10:00',
      '10:30',
      '17:00',
      '17:30',
    ]);
    expect(huecos[0].etiqueta).toBe('lunes, 5 de octubre a las 11:00');
  });

  it('quita los huecos llenos, bloqueados y los días cerrados', () => {
    const lleno = madridAUtc('2026-10-07', '10:00').toISOString();
    const huecos = huecosLibres(
      { ...agenda, cerrado: ['2026-10-12'] },
      lunes9,
      [{ inicio: lleno }],
      [{ inicio: madridAUtc('2026-10-07', '17:00').toISOString(), fin: madridAUtc('2026-10-07', '18:00').toISOString() }]
    );
    expect(huecos.filter((h) => h.fecha === '2026-10-07').map((h) => h.hora)).toEqual(['10:30']);
    expect(huecos.some((h) => h.fecha === '2026-10-12')).toBe(false);
  });

  it('con capacidad 2 el hueco sigue libre hasta la segunda cita', () => {
    const inicio = madridAUtc('2026-10-07', '10:00').toISOString();
    const dos = { ...agenda, capacidad: 2 };
    expect(huecosLibres(dos, lunes9, [{ inicio }]).some((h) => h.inicio === inicio)).toBe(true);
    expect(huecosLibres(dos, lunes9, [{ inicio }, { inicio }]).some((h) => h.inicio === inicio)).toBe(false);
  });

  it('la ventana avanza con los días', () => {
    const despues = huecosLibres(agenda, new Date('2026-10-09T07:00:00Z'));
    expect(despues[0].fecha >= '2026-10-12').toBe(true);
    expect(despues.some((h) => h.fecha === '2026-10-14')).toBe(true);
  });
});

describe('proponerHuecos', () => {
  it('da como mucho dos por día y filtra mañana o tarde', () => {
    const huecos = huecosLibres(agenda, lunes9);
    const tarde = proponerHuecos(huecos, { parte: 'tarde' });
    expect(tarde.every((h) => h.hora >= '14:00')).toBe(true);
    const dosSemanas = huecosLibres({ ...agenda, dias: 14 }, lunes9);
    const todos = proponerHuecos(dosSemanas, { desde: '2026-10-07', limite: 3 });
    expect(todos.map((h) => `${h.fecha} ${h.hora}`)).toEqual([
      '2026-10-07 10:00',
      '2026-10-07 10:30',
      '2026-10-12 10:00',
    ]);
  });

  it('las demos marcan algunos huecos como ocupados, siempre los mismos', () => {
    const huecos = huecosLibres(agenda, lunes9);
    const a = ocupadosDeDemo('autoescuela-ejemplo', huecos);
    expect(a).toEqual(ocupadosDeDemo('autoescuela-ejemplo', huecos));
    expect(a.length).toBeGreaterThan(0);
    expect(a.length).toBeLessThan(huecos.length);
  });
});

describe('telefonoValido', () => {
  it('acepta móviles y fijos españoles y los formatea', () => {
    expect(telefonoValido('+34 600 11 22 33')).toBe('600 11 22 33');
    expect(telefonoValido('961138577')).toBe('961 13 85 77');
    expect(telefonoValido('12345')).toBeNull();
  });
});
