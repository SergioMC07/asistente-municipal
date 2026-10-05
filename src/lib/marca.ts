// ============================================
// Color de marca de cada demo
// ============================================
// Toda la interfaz usa las variables --cobalt*. Con un color de marca se
// redefinen en el contenedor de la demo y el negocio ve sus colores en
// burbujas, botones, sello y panel. Sin color, se queda el cobalto de Atiende.

import type { CSSProperties } from 'react';

export function marcaStyle(color?: string): CSSProperties | undefined {
  if (!color) return undefined;
  return {
    '--cobalt': color,
    '--cobalt-strong': `color-mix(in oklch, ${color} 82%, black)`,
    '--cobalt-text': `color-mix(in oklch, ${color} 86%, black)`,
    '--cobalt-soft': `color-mix(in oklch, ${color} 9%, white)`,
    '--fondo': `color-mix(in oklch, ${color} 4%, white)`,
  } as CSSProperties;
}
