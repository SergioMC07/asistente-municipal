// Qué datos ve cada acceso: los reales del negocio o los de ejemplo de la demo.

import type { DatosAgenda } from '@/lib/citas/vista';
import { datosAgenda } from '@/lib/citas/vista';
import { panelStore, type PanelStore } from './datos';
import { agendaDemo, panelDemo } from './demo';
import type { Acceso } from './sesion';

export function almacen(a: Acceso): PanelStore | null {
  return a.demo ? panelDemo(a.negocio) : panelStore();
}

export function agendaDe(a: Acceso): Promise<DatosAgenda> {
  return a.demo ? Promise.resolve(agendaDemo(a.negocio)) : datosAgenda(a.negocio);
}
