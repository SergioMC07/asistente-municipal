// ============================================
// Genera la demo de un pueblo a partir de su web
// ============================================
// Uso:
//   npm run demo -- https://www.mipueblo.es
//   npm run demo -- https://www.mipueblo.es --slug mipueblo --paginas 30
//
// Lee la web, genera la ficha con IA y la guarda en data/pueblos/<slug>.json.
// Revisa la ficha antes de enviar la demo: es lo que verá el alcalde.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { crawlSite } from '../src/lib/crawl';
import { generateFicha } from '../src/lib/ficha';
import { PUEBLOS_DIR, puebloSchema, slugify, isValidSlug } from '../src/lib/pueblo';

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      args[a.slice(2)] = argv[i + 1] ?? '';
      i += 1;
    } else {
      positional.push(a);
    }
  }
  return { url: positional[0], slug: args.slug, paginas: Number(args.paginas) || 25 };
}

async function loadEnv() {
  // Carga .env.local sin dependencias extra (solo claves simples CLAVE=valor).
  try {
    const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // sin .env.local: se usan las variables del entorno
  }
}

async function main() {
  await loadEnv();
  const { url, slug: slugArg, paginas } = parseArgs(process.argv.slice(2));

  if (!url || !/^https?:\/\//.test(url)) {
    console.error('Uso: npm run demo -- https://www.mipueblo.es [--slug mipueblo] [--paginas 25]');
    process.exit(1);
  }

  console.log(`Leyendo ${url} (hasta ${paginas} páginas)…`);
  const { pages, escudoUrl } = await crawlSite(url, {
    maxPages: paginas,
    onPage: (u) => console.log(`  · ${u}`),
  });
  console.log(`${pages.length} páginas con texto útil. Generando la ficha…`);

  const result = await generateFicha(url, pages);
  const slug = slugArg || slugify(result.nombre);
  if (!isValidSlug(slug)) throw new Error(`Slug no válido: "${slug}". Usa --slug`);

  const pueblo = puebloSchema.parse({
    slug,
    nombre: result.nombre,
    provincia: result.provincia ?? undefined,
    web: url,
    escudoUrl,
    telefono: result.telefono ?? undefined,
    email: result.email ?? undefined,
    horario: result.horario ?? undefined,
    ficha: result.ficha,
    sugerencias: result.sugerencias.slice(0, 4),
    fuentes: pages.map((p) => p.url),
    generadoEl: new Date().toISOString(),
  });

  await fs.mkdir(PUEBLOS_DIR, { recursive: true });
  const file = path.join(PUEBLOS_DIR, `${slug}.json`);
  await fs.writeFile(file, `${JSON.stringify(pueblo, null, 2)}\n`);

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const link = `${base}/${slug}`;
  console.log(`\nFicha guardada en ${path.relative(process.cwd(), file)}`);
  console.log(`Revisa la ficha y abre la demo: ${link}`);
  console.log(`\nMensaje para enviar (después de llamar y tener su permiso):\n`);
  console.log(
    `Hola, como le comentaba, aquí tiene el asistente que he preparado para ${pueblo.nombre} ` +
      `con la información de su web municipal. Pruébelo como un vecino: ${link}`
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
