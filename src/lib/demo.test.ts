import { describe, expect, it } from 'vitest';
import { parseBlocks } from '@/components/RichText';
import { demoWhatsappLink, formatPhone, startLink } from './contact';
import { extractIncidencias, incidenciaId, splitIncidencias } from './incidencia';
import { buildSystemPrompt } from './prompt';
import type { Pueblo } from './pueblo';

describe('splitIncidencias', () => {
  const reply =
    'Gracias por avisar.\n[[INCIDENCIA: Farola fundida | Calle Mayor, 12 | No se enciende desde ayer]]\nQueda registrada.';

  it('separa el texto y la incidencia', () => {
    const segments = splitIncidencias(reply);
    expect(segments.map((s) => s.kind)).toEqual(['text', 'incidencia', 'text']);
    expect(extractIncidencias(reply)).toEqual([
      { tipo: 'Farola fundida', lugar: 'Calle Mayor, 12', detalle: 'No se enciende desde ayer' },
    ]);
  });

  it('oculta la etiqueta a medio escribir durante el streaming', () => {
    const partial = 'Gracias por avisar.\n[[INCIDENCIA: Farola fun';
    expect(splitIncidencias(partial, true)).toEqual([{ kind: 'text', text: 'Gracias por avisar.' }]);
  });

  it('da siempre el mismo número a la misma incidencia', () => {
    const data = { tipo: 'Bache', lugar: 'Plaza', detalle: 'Grande' };
    expect(incidenciaId(data)).toBe(incidenciaId({ ...data }));
    expect(incidenciaId(data)).toMatch(/^INC-\d{4}$/);
  });
});

describe('parseBlocks', () => {
  it('agrupa listas y párrafos', () => {
    const blocks = parseBlocks('Horario:\n- Lunes: **9:00**\n- Martes: 10:00\n\nMás info en la web');
    expect(blocks).toEqual([
      { type: 'p', lines: ['Horario:'] },
      { type: 'ul', items: ['Lunes: **9:00**', 'Martes: 10:00'] },
      { type: 'p', lines: ['Más info en la web'] },
    ]);
  });

  it('convierte títulos en negrita y numera listas', () => {
    expect(parseBlocks('## Pasos\n1. Pedir cita\n2. Ir')).toEqual([
      { type: 'p', lines: ['**Pasos**'] },
      { type: 'ol', items: ['Pedir cita', 'Ir'] },
    ]);
  });
});

describe('enlaces de contacto', () => {
  it('prefiere WhatsApp y cae a email', () => {
    expect(startLink({ whatsapp: '+34 600 111 222', email: 'a@b.es' }, 'Chinchón')).toMatch(
      /^https:\/\/wa\.me\/34600111222\?text=/
    );
    expect(startLink({ email: 'a@b.es' }, 'Chinchón')).toMatch(/^mailto:a@b\.es\?subject=/);
    expect(startLink({}, 'Chinchón')).toBeNull();
  });

  it('el enlace de demo en WhatsApp lleva el nombre del pueblo', () => {
    const link = demoWhatsappLink({ whatsappDemo: '34600111222' }, 'Chinchón');
    expect(decodeURIComponent(link!)).toContain('Hola Chinchón');
    expect(demoWhatsappLink({}, 'Chinchón')).toBeNull();
  });
});

describe('formatPhone', () => {
  it('formatea móviles españoles para mostrarlos', () => {
    expect(formatPhone('34638798445')).toBe('+34 638 79 84 45');
    expect(formatPhone('+44 7700 900123')).toBe('+447700900123');
  });
});

describe('buildSystemPrompt', () => {
  const pueblo: Pueblo = {
    slug: 'villaejemplo',
    nombre: 'Villaejemplo',
    web: 'https://www.villaejemplo.es/',
    telefono: '900 000 000',
    ficha: '## Ayuntamiento\n- Teléfono: 900 000 000',
    sugerencias: [],
    fuentes: [],
    generadoEl: '2026-10-04T00:00:00.000Z',
  };

  it('incluye la ficha, el formato de incidencias y el contacto comercial', () => {
    const prompt = buildSystemPrompt(pueblo, { contactoComercial: 'hola@demo.es' });
    expect(prompt).toContain('<ficha>\n## Ayuntamiento');
    expect(prompt).toContain('[[INCIDENCIA: tipo breve | lugar | detalle en una frase]]');
    expect(prompt).toContain('hola@demo.es');
    expect(prompt).toContain('teléfono 900 000 000');
  });
});

describe('isRealVisitor', () => {
  it('ignora las vistas previas de enlaces y los bots', async () => {
    const { isRealVisitor } = await import('./notify');
    expect(isRealVisitor('WhatsApp/2.23.20.0')).toBe(false);
    expect(isRealVisitor('facebookexternalhit/1.1')).toBe(false);
    expect(isRealVisitor(null)).toBe(false);
    expect(
      isRealVisitor('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari')
    ).toBe(true);
  });
});
