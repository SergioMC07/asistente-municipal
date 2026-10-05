// ============================================
// Graba el vídeo de todas las demos
// ============================================
// Uso:
//   npm run videos -- --url https://tu-proyecto.vercel.app
//   npm run videos -- --url https://tu-proyecto.vercel.app manzanares-el-real cercedilla
//
// Sin nombres, graba todos los pueblos de data/pueblos/ menos el de ejemplo.
// Cada vídeo queda en prospectos/<slug>/video/.

import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PUEBLOS_DIR } from '../src/lib/pueblo';

const EJEMPLO = 'villaejemplo';

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
      if (f.endsWith('.json') && f !== `${EJEMPLO}.json`) slugs.push(f.replace(/\.json$/, ''));
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
