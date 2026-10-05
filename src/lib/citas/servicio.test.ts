import { describe, expect, it } from 'vitest';
import { puebloSchema } from '@/lib/pueblo';
import { splitIncidencias } from '@/lib/incidencia';
import { ics } from './ics';
import { marcaCita, reservar, verHuecos } from './servicio';
import { MemoryStore } from './store';

const negocio = (modo: 'demo' | 'real', horario: Record<string, string[]> = { '3': ['10:00-11:00'] }) =>
  puebloSchema.parse({
    slug: 'autoescuela-prueba',
    tipo: 'negocio',
    nombre: 'Autoescuela Prueba',
    web: 'https://example.com/',
    ficha: '## Autoescuela',
    generadoEl: '2026-10-05T00:00:00.000Z',
    citas: {
      tipos: ['Información y matrícula'],
      duracion: 30,
      horario,
      antelacion: 60,
      dias: 7,
      modo,
      lugar: 'C/ Mayor, 1',
    },
  });

const lunes = new Date('2026-10-05T07:00:00Z');
const datos = { fecha: '2026-10-07', hora: '10:00', nombre: 'Lucía', telefono: '600 11 22 33' };

describe('reservar en modo real', () => {
  it('guarda la cita y el hueco deja de ofrecerse', async () => {
    const store = new MemoryStore();
    const pueblo = negocio('real');
    const r = await reservar(pueblo, datos, lunes, store);
    expect(r.ok && !r.demo && r.cita.telefono).toBe('600 11 22 33');
    expect(store.citas).toHaveLength(1);

    const despues = await verHuecos(pueblo, {}, lunes, store);
    expect(despues.ok && despues.huecos.map((h) => h.hora)).toEqual(['10:30']);
  });

  it('si el hueco se ocupa a la vez, la segunda persona recibe alternativas', async () => {
    const store = new MemoryStore();
    const pueblo = negocio('real');
    await reservar(pueblo, datos, lunes, store);
    const segunda = await reservar(pueblo, { ...datos, nombre: 'Pablo' }, lunes, store);
    expect(segunda.ok).toBe(false);
    expect(!segunda.ok && segunda.alternativas?.map((h) => h.hora)).toEqual(['10:30']);
  });

  it('rechaza teléfonos que no son españoles de 9 cifras', async () => {
    const r = await reservar(negocio('real'), { ...datos, telefono: '1234' }, lunes, new MemoryStore());
    expect(r.ok).toBe(false);
  });
});

describe('reservar en modo demo', () => {
  it('simula la cita sin guardarla', async () => {
    const store = new MemoryStore();
    const semana = { '1': ['10:00-14:00'], '2': ['10:00-14:00'], '3': ['10:00-14:00'] };
    const huecos = await verHuecos(negocio('demo', semana), {}, lunes, store);
    expect(huecos.ok).toBe(true);
    const libre = huecos.ok ? huecos.huecos[0] : null;
    const r = await reservar(negocio('demo', semana), { ...datos, fecha: libre!.fecha, hora: libre!.hora }, lunes, store);
    expect(r.ok && r.demo).toBe(true);
    expect(store.citas).toHaveLength(0);
  });
});

describe('tarjeta y calendario', () => {
  it('la marca de la cita se convierte en tarjeta', () => {
    const cita = {
      id: 'c1',
      slug: 's',
      tipo: 'Información y matrícula',
      inicio: '2026-10-07T08:00:00.000Z',
      fin: '2026-10-07T08:30:00.000Z',
      plaza: 1,
      nombre: 'Lucía',
      telefono: '600 11 22 33',
      origen: 'asistente' as const,
      estado: 'confirmada' as const,
    };
    const [seg] = splitIncidencias(marcaCita(cita, 'C/ Mayor, 1', true));
    expect(seg).toEqual({
      kind: 'cita',
      data: {
        id: 'c1',
        tipo: 'Información y matrícula',
        inicio: '2026-10-07T08:00:00.000Z',
        fin: '2026-10-07T08:30:00.000Z',
        lugar: 'C/ Mayor, 1',
        nombre: 'Lucía',
        demo: true,
      },
    });
  });

  it('genera un .ics válido', () => {
    const texto = ics([
      { uid: 'c1', inicio: '2026-10-07T08:00:00.000Z', fin: '2026-10-07T08:30:00.000Z', titulo: 'Cita, matrícula' },
    ]);
    expect(texto).toContain('DTSTART:20261007T080000Z');
    expect(texto).toContain('SUMMARY:Cita\\, matrícula');
  });
});
