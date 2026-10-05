// ============================================
// «Mi información»: lo que el negocio cambia desde su panel
// ============================================
// La ficha base vive en data/pueblos/<slug>.json (la prepara Atentia). Los
// cambios del negocio se guardan aparte, en Supabase, y se aplican encima al
// cargar la ficha: así nunca se pierde la versión original y no hace falta
// desplegar para que el asistente use los datos nuevos.

import type { Pueblo } from '@/lib/pueblo';
import { supabase, supabaseConfig, supabaseLista } from '@/lib/supabase';

export type Enlace = {
  url: string;
  titulo: string;
  /** Lo útil de la página, resumido para el asistente. */
  resumen: string;
  leido: string;
};

export type Informacion = {
  slug: string;
  /** Ficha completa editada; null = la de Atentia sin cambios. */
  ficha: string | null;
  telefono: string | null;
  email: string | null;
  horario: string | null;
  enlaces: Enlace[];
  /** Ficha anterior al último guardado, para deshacer. */
  anterior: string | null;
  actualizada: string;
  editada_por: string | null;
};

export type Cambios = Partial<Pick<Informacion, 'ficha' | 'telefono' | 'email' | 'horario' | 'enlaces'>>;

export const MAX_ENLACES = 10;
export const MAX_FICHA = 30_000;

export interface InformacionStore {
  leer(slug: string): Promise<Informacion | null>;
  guardar(slug: string, cambios: Cambios, email: string | null, ahora?: Date): Promise<Informacion>;
}

function nueva(slug: string): Informacion {
  return {
    slug,
    ficha: null,
    telefono: null,
    email: null,
    horario: null,
    enlaces: [],
    anterior: null,
    actualizada: new Date(0).toISOString(),
    editada_por: null,
  };
}

/** Aplica los cambios y guarda la ficha anterior si la ficha cambia. */
export function combinar(antes: Informacion, cambios: Cambios, email: string | null, ahora: Date): Informacion {
  const fichaCambia = cambios.ficha !== undefined && cambios.ficha !== antes.ficha;
  return {
    ...antes,
    ...cambios,
    anterior: fichaCambia ? antes.ficha : antes.anterior,
    actualizada: ahora.toISOString(),
    editada_por: email,
  };
}

class SupabaseInformacion implements InformacionStore {
  constructor(private cfg: { url: string; key: string }) {}

  async leer(slug: string) {
    const [fila] = await supabaseLista<Informacion>(this.cfg, `informacion?slug=eq.${encodeURIComponent(slug)}`);
    return fila ?? null;
  }

  async guardar(slug: string, cambios: Cambios, email: string | null, ahora = new Date()) {
    const fila = combinar((await this.leer(slug)) ?? nueva(slug), cambios, email, ahora);
    const res = await supabase(this.cfg, 'informacion?on_conflict=slug', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: JSON.stringify(fila),
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    return ((await res.json()) as Informacion[])[0];
  }
}

export class MemoryInformacion implements InformacionStore {
  filas = new Map<string, Informacion>();

  async leer(slug: string) {
    return this.filas.get(slug) ?? null;
  }

  async guardar(slug: string, cambios: Cambios, email: string | null, ahora = new Date()) {
    const fila = combinar(this.filas.get(slug) ?? nueva(slug), cambios, email, ahora);
    this.filas.set(slug, fila);
    return fila;
  }
}

const global = globalThis as unknown as { __atentiaInformacion?: MemoryInformacion };

export function informacionStore(): InformacionStore | null {
  const cfg = supabaseConfig();
  if (cfg) return new SupabaseInformacion(cfg);
  if (process.env.NODE_ENV !== 'production') return (global.__atentiaInformacion ??= new MemoryInformacion());
  return null;
}

// Cada petición del chat carga la ficha: una caché corta evita consultar
// Supabase en cada mensaje. Los cambios se ven en menos de un minuto.
const CACHE_MS = 30_000;
const cache = new Map<string, { info: Informacion | null; hasta: number }>();

export async function informacionDe(slug: string): Promise<Informacion | null> {
  const enCache = cache.get(slug);
  if (enCache && enCache.hasta > Date.now()) return enCache.info;
  const store = informacionStore();
  if (!store) return null;
  try {
    const info = await store.leer(slug);
    cache.set(slug, { info, hasta: Date.now() + CACHE_MS });
    return info;
  } catch (err) {
    // Si Supabase falla, el asistente sigue con la ficha de Atentia.
    console.error('No se pudo leer la información editada:', err);
    return enCache?.info ?? null;
  }
}

export function olvidarCache(slug: string) {
  cache.delete(slug);
}

/** La ficha que usa el asistente: la de Atentia con los cambios del negocio encima. */
export function aplicarInformacion(p: Pueblo, info: Informacion | null): Pueblo {
  if (!info) return p;
  const enlaces = info.enlaces.length
    ? `\n\n## Información de sus enlaces\n${info.enlaces
        .map((e) => `\n### ${e.titulo || e.url}\nURL: ${e.url}\n${e.resumen}`)
        .join('\n')}`
    : '';
  const editada = info.ficha !== null || info.enlaces.length > 0;
  return {
    ...p,
    ficha: `${info.ficha ?? p.ficha}${enlaces}`,
    telefono: info.telefono ?? p.telefono,
    email: info.email ?? p.email,
    horario: info.horario ?? p.horario,
    generadoEl: editada ? info.actualizada : p.generadoEl,
  };
}
