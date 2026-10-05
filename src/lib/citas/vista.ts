// Datos de la agenda para la pantalla de gestión (enlace secreto o panel).

import type { Pueblo } from '@/lib/pueblo';
import { etiquetaHueco, fechaMadrid, huecosLibres } from './agenda';
import { citasStore } from './store';

export type DatosAgenda =
  | { estado: 'sin-agenda' | 'demo' }
  | {
      estado: 'real';
      hoy: string;
      citas: {
        id: string;
        tipo: string;
        inicio: string;
        nombre: string;
        telefono: string;
        nota?: string | null;
        origen: 'asistente' | 'manual';
        etiqueta: string;
        dia: string;
      }[];
      bloqueos: { id: string; etiqueta: string; motivo?: string | null }[];
      libres: { fecha: string; hora: string; etiqueta: string }[];
    };

export async function datosAgenda(pueblo: Pueblo, ahora = new Date()): Promise<DatosAgenda> {
  const agenda = pueblo.citas;
  if (!agenda) return { estado: 'sin-agenda' };
  const store = citasStore();
  if (agenda.modo !== 'real' || !store) return { estado: 'demo' };

  const hasta = new Date(ahora.getTime() + (agenda.dias + 1) * 86_400_000);
  const desdeHoy = new Date(`${fechaMadrid(ahora).fecha}T00:00:00Z`);
  const [citas, bloqueos] = await Promise.all([
    store.confirmadas(pueblo.slug, desdeHoy, hasta),
    store.bloqueos(pueblo.slug, ahora, hasta),
  ]);
  return {
    estado: 'real',
    hoy: fechaMadrid(ahora).fecha,
    citas: citas
      .filter((c) => new Date(c.fin) > ahora)
      .map((c) => ({ ...c, etiqueta: etiquetaHueco(new Date(c.inicio)), dia: fechaMadrid(new Date(c.inicio)).fecha })),
    bloqueos: bloqueos.map((b) => ({
      ...b,
      etiqueta: `${etiquetaHueco(new Date(b.inicio)).replace(' a las ', ', de ')} a ${fechaMadrid(new Date(b.fin)).hora}`,
    })),
    libres: huecosLibres(agenda, ahora, citas, bloqueos).map(({ fecha, hora, etiqueta }) => ({ fecha, hora, etiqueta })),
  };
}
