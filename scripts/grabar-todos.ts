// ============================================
// Graba el vídeo de todas las demos
// ============================================
// Uso:
//   npm run videos -- --url https://tu-proyecto.vercel.app
//   npm run videos -- --url https://tu-proyecto.vercel.app manzanares-el-real cercedilla
//
// Sin nombres, graba todas las demos de data/pueblos/ menos los ejemplos.
// Cada vídeo queda en prospectos/ayuntamientos/<slug>/video/ o prospectos/empresas/<slug>/video/.

import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PUEBLOS_DIR } from '../src/lib/pueblo';

// Ejemplos ficticios de las landings: no se graban.
const EJEMPLOS = new Set(['villaejemplo', 'autoescuela-ejemplo']);

async function main() {
  const argv = process.argv.slice(2);
  const opciones: string[] = [];
  const slugs: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      opciones.push(argv[i], argv[i + 1] ?? '');
      i += 1;
    } else {
      slugs.push(argv[i]);
    }
  }

  if (!slugs.length) {
    const files = await fs.readdir(PUEBLOS_DIR);
    for (const f of files.sort()) {
      const slug = f.replace(/\.json$/, '');
      if (f.endsWith('.json') && !EJEMPLOS.has(slug)) slugs.push(slug);
    }
  }

  const fallidos: string[] = [];
  for (const [i, slug] of slugs.entries()) {
    console.log(`\n[${i + 1}/${slugs.length}] ${slug}`);
    const r = spawnSync('npx', ['tsx', path.join('scripts', 'grabar-video.ts'), slug, ...opciones], {
      stdio: 'inherit',
    });
    if (r.status !== 0) fallidos.push(slug);
  }

  console.log(`\nGrabados: ${slugs.length - fallidos.length} de ${slugs.length}.`);
  if (fallidos.length) {
    console.log(`Han fallado: ${fallidos.join(', ')}. Vuelve a lanzarlos con:`);
    console.log(`  npm run videos -- ${opciones.join(' ')} ${fallidos.join(' ')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
