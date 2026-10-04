// ============================================
// Lectura de la web municipal
// ============================================
// Recorre las páginas más útiles de la web del ayuntamiento (horarios,
// trámites, servicios, fiestas…) y devuelve su texto limpio.

import * as cheerio from 'cheerio';

export type PageText = { url: string; title: string; text: string };

const USER_AGENT =
  'Mozilla/5.0 (compatible; AsistenteMunicipalBot/0.1; +demo para el ayuntamiento)';

const MAX_TEXT_PER_PAGE = 8_000;
const MAX_HTML_BYTES = 3_000_000;

// Palabras que indican que una página tiene información útil para el vecino.
// El peso decide qué páginas se leen primero cuando hay muchas.
const KEYWORDS: Array<[RegExp, number]> = [
  [/horario|contact|tel[eé]fono|direcci[oó]n|d[oó]nde-estamos|ubicaci/i, 10],
  [/tr[aá]mite|sede|registro|padr[oó]n|empadrona|certificad|instancia/i, 9],
  [/residuo|basura|recogida|enseres|limpieza|punto-limpio|ecoparque/i, 9],
  [/servicio|ayuntamiento|oficina|atenci[oó]n/i, 7],
  [/tasa|impuesto|ibi|ordenanza|tributo|recaudaci/i, 7],
  [/fiesta|agenda|evento|cultura|biblioteca|casa-de-la-cultura/i, 6],
  [/deporte|polideportivo|piscina|gimnasio|instalaciones/i, 6],
  [/social|mayores|bienestar|igualdad|juventud|infancia/i, 6],
  [/salud|consultorio|centro-de-salud|farmacia|cementerio/i, 5],
  [/educaci[oó]n|colegio|escuela|instituto|guarder/i, 5],
  [/transporte|autob[uú]s|taxi|aparcamiento/i, 5],
  [/turismo|visita|historia|municipio|localidad/i, 3],
  [/empleo|bolsa|oferta/i, 3],
];

// Rutas que no aportan nada al vecino o que no son HTML.
const SKIP_EXT = /\.(pdf|jpe?g|png|gif|svg|webp|zip|rar|docx?|xlsx?|pptx?|odt|mp3|mp4|avi|ics|xml|rss)(\?|$)/i;
const SKIP_PATH = /login|acceso|wp-admin|wp-login|feed|\/tag\/|\/author\/|print=|imprimir|calendar\/\d{4}|\?share=|replytocom/i;

/** Puntuación de un enlace según su URL y su texto. 0 = no interesa. */
export function scoreLink(url: string, anchorText: string): number {
  const haystack = `${url} ${anchorText}`;
  let score = 0;
  for (const [re, weight] of KEYWORDS) if (re.test(haystack)) score += weight;
  return score;
}

/** Normaliza un href relativo, quita el ancla y descarta lo que no es una página. */
export function normalizeLink(href: string, base: string): string | null {
  if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href.trim())) return null;
  let url: URL;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  url.hash = '';
  const full = url.toString();
  if (SKIP_EXT.test(url.pathname) || SKIP_PATH.test(full)) return null;
  return full;
}

/** Mismo sitio, aceptando "www." y subdominios del mismo dominio (p. ej. sede.). */
export function isSameSite(url: string, root: string): boolean {
  const host = (u: string) => new URL(u).hostname.replace(/^www\./, '');
  const a = host(url);
  const b = host(root);
  return a === b || a.endsWith(`.${b}`);
}

export type ExtractedPage = PageText & {
  links: Array<{ url: string; text: string }>;
  images: Array<{ src: string; alt: string }>;
  ogImage?: string;
};

/** Extrae título, texto legible, enlaces e imágenes de una página HTML. */
export function extractPage(html: string, url: string): ExtractedPage {
  const $ = cheerio.load(html);

  const links: ExtractedPage['links'] = [];
  $('a[href]').each((_, el) => {
    const normalized = normalizeLink($(el).attr('href') ?? '', url);
    if (normalized) links.push({ url: normalized, text: $(el).text().replace(/\s+/g, ' ').trim() });
  });

  const images: ExtractedPage['images'] = [];
  $('img[src]').each((_, el) => {
    try {
      const src = new URL($(el).attr('src') ?? '', url).toString();
      images.push({ src, alt: ($(el).attr('alt') ?? '').trim() });
    } catch {
      // src no válido: se ignora
    }
  });
  const ogImage = $('meta[property="og:image"]').attr('content') || undefined;

  const title = $('title').first().text().replace(/\s+/g, ' ').trim();

  $('script, style, noscript, svg, iframe, form, button, [aria-hidden="true"]').remove();
  // Los saltos entre bloques ayudan a que la IA distinga datos (horario, teléfono…).
  $('br, p, div, li, tr, h1, h2, h3, h4, h5, h6, section, article, td, dd, dt').each((_, el) => {
    $(el).append('\n');
  });
  const text = $('body')
    .text()
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
    .slice(0, MAX_TEXT_PER_PAGE);

  return { url, title, text, links, images, ogImage };
}

/** Busca la imagen que con más probabilidad es el escudo del ayuntamiento. */
export function pickEscudo(page: ExtractedPage): string | undefined {
  const byAlt = page.images.find((i) => /escudo|coat of arms/i.test(`${i.alt} ${i.src}`));
  if (byAlt) return byAlt.src;
  const logo = page.images.find((i) => /logo|ayuntamiento|ajuntament|concello/i.test(`${i.alt} ${i.src}`));
  if (logo) return logo.src;
  return page.ogImage;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('text/html')) return null;
    const html = await res.text();
    return html.length > MAX_HTML_BYTES ? html.slice(0, MAX_HTML_BYTES) : html;
  } catch {
    return null;
  }
}

/**
 * Lee la portada y las páginas más prometedoras (hasta `maxPages`), en dos
 * niveles de profundidad. Va de una en una para no sobrecargar la web municipal.
 */
export async function crawlSite(
  startUrl: string,
  { maxPages = 25, onPage }: { maxPages?: number; onPage?: (url: string) => void } = {}
): Promise<{ pages: PageText[]; escudoUrl?: string }> {
  const home = await fetchHtml(startUrl);
  if (!home) throw new Error(`No se ha podido leer ${startUrl}`);

  const first = extractPage(home, startUrl);
  onPage?.(startUrl);
  const pages: PageText[] = [{ url: first.url, title: first.title, text: first.text }];
  const escudoUrl = pickEscudo(first);

  const seen = new Set<string>([startUrl]);
  const queue = new Map<string, number>();
  const enqueue = (links: ExtractedPage['links'], depthPenalty: number) => {
    for (const { url, text } of links) {
      if (seen.has(url) || !isSameSite(url, startUrl)) continue;
      const score = scoreLink(url, text) - depthPenalty;
      if (score <= 0) continue;
      queue.set(url, Math.max(queue.get(url) ?? 0, score));
    }
  };
  enqueue(first.links, 0);

  let fetchedSecondLevel = 0;
  while (pages.length < maxPages && queue.size > 0) {
    const [next] = [...queue.entries()].sort((a, b) => b[1] - a[1])[0];
    queue.delete(next);
    seen.add(next);

    const html = await fetchHtml(next);
    if (!html) continue;
    const page = extractPage(html, next);
    onPage?.(next);
    if (page.text.length > 200) pages.push({ url: page.url, title: page.title, text: page.text });

    // Segundo nivel solo desde las primeras páginas, con penalización.
    if (fetchedSecondLevel < 8) {
      enqueue(page.links, 4);
      fetchedSecondLevel += 1;
    }
  }

  return { pages, escudoUrl };
}
