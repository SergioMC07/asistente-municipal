// ============================================
// Enlace secreto de gestión de la agenda de un negocio
// ============================================
// Uso: npm run gestion -- <slug> [--url https://tu-proyecto.vercel.app]
//
// Crea un enlace nuevo (el anterior deja de funcionar), guarda en la ficha
// solo su huella (SHA-256) y muestra el enlace para pasárselo al negocio.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nuevoToken } from '../src/lib/citas/gestion';
import { PUEBLOS_DIR } from '../src/lib/pueblo';

async function main() {
  const [slug, ...resto] = process.argv.slice(2);
  const i = resto.indexOf('--url');
  const base = (i >= 0 ? resto[i + 1] : process.env.NEXT_PUBLIC_APP_URL || 'https://asistente-municipal.vercel.app').replace(
    /\/+$/,
    ''
  );
  if (!slug) {
    console.error('Uso: npm run gestion -- <slug> [--url https://tu-proyecto.vercel.app]');
    process.exit(1);
  }
  const file = path.join(PUEBLOS_DIR, `${slug}.json`);
  const ficha = JSON.parse(await fs.readFile(file, 'utf8'));
  if (!ficha.citas) throw new Error(`${slug} no tiene agenda de citas en su ficha.`);

  const { token, hash } = nuevoToken();
  ficha.citas.gestion = hash;
  await fs.writeFile(file, `${JSON.stringify(ficha, null, 2)}\n`);

  console.log(`\nEnlace de gestión de ${ficha.nombre} (pásaselo solo al negocio):\n`);
  console.log(`  ${base}/gestion/${slug}?t=${token}\n`);
  console.log('Sube el cambio de la ficha (git commit y push) para que funcione en la web publicada.');
  console.log('No se puede recuperar: si se pierde, vuelve a ejecutar este comando.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
