import { describe, expect, it } from 'vitest';
import { partir, unir } from '@/components/panel/EditorInformacion';
import { puebloSchema } from '@/lib/pueblo';
import { ipPrivada } from './enlaces';
import { aplicarInformacion, MemoryInformacion } from './informacion';

const base = puebloSchema.parse({
  slug: 'centro',
  tipo: 'negocio',
  nombre: 'Centro',
  web: 'https://example.com/',
  telefono: '960 000 000',
  ficha: '## Precios\n- Matrícula: 100 €',
  generadoEl: '2026-01-01T00:00:00.000Z',
});

describe('Mi información', () => {
  it('parte la ficha por apartados y la vuelve a unir igual', () => {
    const ficha = 'Intro del centro.\n\n## Precios\n- Matrícula: 100 €\n### Detalle\n- Algo\n\n## Horario\n- L-V 10-14';
    const s = partir(ficha);
    expect(s.map((x) => x.titulo)).toEqual(['', 'Precios', 'Horario']);
    expect(unir(s)).toBe(ficha);
    expect(unir([...s, { id: 99, titulo: '', texto: '  ' }])).toBe(ficha);
  });

  it('guarda la versión anterior para poder deshacer', async () => {
    const store = new MemoryInformacion();
    await store.guardar('centro', { ficha: 'v1' }, 'a@b.es');
    const v2 = await store.guardar('centro', { ficha: 'v2' }, 'a@b.es');
    expect(v2).toMatchObject({ ficha: 'v2', anterior: 'v1', editada_por: 'a@b.es' });
    const conEnlace = await store.guardar('centro', { enlaces: [] }, 'a@b.es');
    expect(conEnlace.anterior).toBe('v1');
  });

  it('el asistente usa lo editado y los enlaces encima de la ficha original', () => {
    expect(aplicarInformacion(base, null)).toBe(base);
    const p = aplicarInformacion(base, {
      slug: 'centro',
      ficha: '## Precios\n- Matrícula: 120 €',
      telefono: '960 111 111',
      email: null,
      horario: null,
      enlaces: [{ url: 'https://example.com/cursos', titulo: 'Cursos', resumen: '- Curso intensivo en julio', leido: '' }],
      anterior: null,
      actualizada: '2026-10-05T10:00:00.000Z',
      editada_por: 'a@b.es',
    });
    expect(p.ficha).toContain('120 €');
    expect(p.ficha).not.toContain('100 €');
    expect(p.ficha).toContain('Curso intensivo en julio');
    expect(p.telefono).toBe('960 111 111');
    expect(p.generadoEl).toBe('2026-10-05T10:00:00.000Z');
  });

  it('no deja leer direcciones internas', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.1.1', '172.20.0.1', '169.254.169.254', '::1', 'fd00::1', '::ffff:127.0.0.1']) {
      expect(ipPrivada(ip)).toBe(true);
    }
    for (const ip of ['8.8.8.8', '172.32.0.1', '2a00:1450::1']) expect(ipPrivada(ip)).toBe(false);
  });
});
