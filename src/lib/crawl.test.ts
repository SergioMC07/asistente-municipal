import { describe, expect, it } from 'vitest';
import { extractPage, isSameSite, normalizeLink, pickEscudo, scoreLink } from './crawl';

const BASE = 'https://www.villaejemplo.es/';

describe('normalizeLink', () => {
  it('resuelve rutas relativas y quita el ancla', () => {
    expect(normalizeLink('/tramites#padron', BASE)).toBe('https://www.villaejemplo.es/tramites');
  });

  it('descarta mailto, tel, javascript y anclas', () => {
    for (const href of ['mailto:a@b.es', 'tel:900', 'javascript:void(0)', '#arriba', '']) {
      expect(normalizeLink(href, BASE)).toBeNull();
    }
  });

  it('descarta documentos y páginas de acceso', () => {
    expect(normalizeLink('/bando.pdf', BASE)).toBeNull();
    expect(normalizeLink('/wp-login.php', BASE)).toBeNull();
    expect(normalizeLink('/foto.JPG?v=2', BASE)).toBeNull();
  });
});

describe('isSameSite', () => {
  it('acepta www y subdominios del mismo dominio', () => {
    expect(isSameSite('https://villaejemplo.es/x', BASE)).toBe(true);
    expect(isSameSite('https://sede.villaejemplo.es/', BASE)).toBe(true);
  });

  it('rechaza otros dominios', () => {
    expect(isSameSite('https://www.facebook.com/villaejemplo', BASE)).toBe(false);
    expect(isSameSite('https://villaejemplo.es.malicioso.com/', BASE)).toBe(false);
  });
});

describe('scoreLink', () => {
  it('prioriza horarios y trámites sobre noticias', () => {
    expect(scoreLink('https://x.es/horarios', 'Horario de atención')).toBeGreaterThan(
      scoreLink('https://x.es/turismo', 'Visita el pueblo')
    );
    expect(scoreLink('https://x.es/noticias/123', 'Gana el equipo local')).toBe(0);
  });
});

describe('extractPage', () => {
  const html = `<html><head><title> Ayuntamiento de Villaejemplo </title>
    <meta property="og:image" content="https://www.villaejemplo.es/og.png"></head>
    <body><script>var x = 1;</script>
    <img src="/img/escudo.png" alt="Escudo de Villaejemplo">
    <p>Horario: lunes a viernes de 9:00 a 14:00</p><p>Teléfono 900 000 000</p>
    <a href="/tramites">Trámites</a><a href="https://twitter.com/x">Twitter</a>
    </body></html>`;

  it('saca título, texto sin scripts y enlaces', () => {
    const page = extractPage(html, BASE);
    expect(page.title).toBe('Ayuntamiento de Villaejemplo');
    expect(page.text).toContain('Horario: lunes a viernes de 9:00 a 14:00');
    expect(page.text).toContain('Teléfono 900 000 000');
    expect(page.text).not.toContain('var x');
    expect(page.links.map((l) => l.url)).toContain('https://www.villaejemplo.es/tramites');
  });

  it('encuentra el escudo por su texto alternativo', () => {
    expect(pickEscudo(extractPage(html, BASE))).toBe('https://www.villaejemplo.es/img/escudo.png');
  });
});
