// ============================================
// Descargas para Excel (CSV que Excel en español abre bien)
// ============================================
// Separador «;», BOM para los acentos y saltos de línea de Windows.

type Celda = string | number | null | undefined;

const celda = (v: Celda) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function csv(cabecera: string[], filas: Celda[][]): string {
  return `﻿${[cabecera, ...filas].map((f) => f.map(celda).join(';')).join('\r\n')}\r\n`;
}

const fecha = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' });
const hora = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', timeStyle: 'short' });

/** "07/10/2026" y "17:30" en hora de España. */
export const fechaHora = (iso: string) => [fecha.format(new Date(iso)), hora.format(new Date(iso))];
