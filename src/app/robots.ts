import type { MetadataRoute } from 'next';

// La portada y las páginas legales se pueden indexar. Las demos llevan su
// propia etiqueta noindex: se comparten solo por enlace.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' } };
}
