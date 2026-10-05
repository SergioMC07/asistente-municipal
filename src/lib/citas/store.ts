// ============================================
// Dónde se guardan las citas y los bloqueos
// ============================================
// En producción, Supabase (Postgres en la UE) por su API REST, sin SDK.
// Un índice único (slug, inicio, plaza) entre las citas confirmadas impide
// que dos personas se queden el mismo hueco a la vez: la segunda inserción
// falla y se prueba la plaza siguiente hasta llenar la capacidad.
// Sin Supabase configurado (desarrollo y tests) se usa una agenda en memoria.

import { supabaseConfig } from '@/lib/supabase';

export type Cita = {
  id: string;
  slug: string;
  tipo: string;
  inicio: string;
  fin: string;
  plaza: number;
  nombre: string;
  telefono: string;
  nota?: string | null;
  origen: 'asistente' | 'manual';
  estado: 'confirmada' | 'cancelada';
  creada?: string;
};

export type NuevaCita = Omit<Cita, 'id' | 'plaza' | 'estado' | 'creada'>;

export type BloqueoGuardado = { id: string; slug: string; inicio: string; fin: string; motivo?: string | null };

export interface CitasStore {
  confirmadas(slug: string, desde: Date, hasta: Date): Promise<Cita[]>;
  bloqueos(slug: string, desde: Date, hasta: Date): Promise<BloqueoGuardado[]>;
  /** Reserva una plaza libre del hueco. Devuelve null si ya está lleno. */
  crear(cita: NuevaCita, capacidad: number): Promise<Cita | null>;
  cancelar(slug: string, id: string): Promise<boolean>;
  bloquear(bloqueo: Omit<BloqueoGuardado, 'id'>): Promise<BloqueoGuardado>;
  desbloquear(slug: string, id: string): Promise<boolean>;
}

// ---------- Supabase ----------

class SupabaseStore implements CitasStore {
  constructor(
    private url: string,
    private key: string
  ) {}

  private async req(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${this.url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...init.headers,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  }

  private async lista<T>(path: string): Promise<T[]> {
    const res = await this.req(path);
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    return (await res.json()) as T[];
  }

  confirmadas(slug: string, desde: Date, hasta: Date) {
    const q = new URLSearchParams({ slug: `eq.${slug}`, estado: 'eq.confirmada', order: 'inicio.asc' });
    return this.lista<Cita>(
      `citas?${q}&inicio=gte.${desde.toISOString()}&inicio=lt.${hasta.toISOString()}`
    );
  }

  bloqueos(slug: string, desde: Date, hasta: Date) {
    const q = new URLSearchParams({ slug: `eq.${slug}`, order: 'inicio.asc' });
    return this.lista<BloqueoGuardado>(
      `bloqueos?${q}&fin=gt.${desde.toISOString()}&inicio=lt.${hasta.toISOString()}`
    );
  }

  async crear(cita: NuevaCita, capacidad: number) {
    for (let plaza = 1; plaza <= capacidad; plaza++) {
      const res = await this.req('citas', { method: 'POST', body: JSON.stringify({ ...cita, plaza }) });
      if (res.ok) return ((await res.json()) as Cita[])[0];
      if (res.status !== 409) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    }
    return null;
  }

  async cancelar(slug: string, id: string) {
    const res = await this.req(`citas?id=eq.${encodeURIComponent(id)}&slug=eq.${slug}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'cancelada' }),
    });
    return res.ok && ((await res.json()) as unknown[]).length > 0;
  }

  async bloquear(bloqueo: Omit<BloqueoGuardado, 'id'>) {
    const res = await this.req('bloqueos', { method: 'POST', body: JSON.stringify(bloqueo) });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    return ((await res.json()) as BloqueoGuardado[])[0];
  }

  async desbloquear(slug: string, id: string) {
    const res = await this.req(`bloqueos?id=eq.${encodeURIComponent(id)}&slug=eq.${slug}`, { method: 'DELETE' });
    return res.ok && ((await res.json()) as unknown[]).length > 0;
  }
}

// ---------- Memoria (desarrollo y tests) ----------

export class MemoryStore implements CitasStore {
  citas: Cita[] = [];
  lista: BloqueoGuardado[] = [];
  private n = 0;

  async confirmadas(slug: string, desde: Date, hasta: Date) {
    return this.citas.filter(
      (c) => c.slug === slug && c.estado === 'confirmada' && new Date(c.inicio) >= desde && new Date(c.inicio) < hasta
    );
  }

  async bloqueos(slug: string, desde: Date, hasta: Date) {
    return this.lista.filter((b) => b.slug === slug && new Date(b.fin) > desde && new Date(b.inicio) < hasta);
  }

  async crear(cita: NuevaCita, capacidad: number) {
    const mismas = this.citas.filter(
      (c) => c.slug === cita.slug && c.estado === 'confirmada' && c.inicio === cita.inicio
    );
    if (mismas.length >= capacidad) return null;
    const nueva: Cita = { ...cita, id: `c${++this.n}`, plaza: mismas.length + 1, estado: 'confirmada' };
    this.citas.push(nueva);
    return nueva;
  }

  async cancelar(slug: string, id: string) {
    const c = this.citas.find((x) => x.slug === slug && x.id === id && x.estado === 'confirmada');
    if (c) c.estado = 'cancelada';
    return !!c;
  }

  async bloquear(bloqueo: Omit<BloqueoGuardado, 'id'>) {
    const nuevo = { ...bloqueo, id: `b${++this.n}` };
    this.lista.push(nuevo);
    return nuevo;
  }

  async desbloquear(slug: string, id: string) {
    const antes = this.lista.length;
    this.lista = this.lista.filter((b) => !(b.slug === slug && b.id === id));
    return this.lista.length < antes;
  }
}

// En desarrollo cada ruta puede cargar su propia copia del módulo: la agenda en
// memoria se guarda en globalThis para que todas vean las mismas citas.
const global = globalThis as unknown as { __atiendeCitas?: MemoryStore };

/**
 * Supabase si están SUPABASE_URL y SUPABASE_SERVICE_KEY; si no, en desarrollo
 * una agenda en memoria. En producción sin Supabase devuelve null y las
 * agendas en modo real se comportan como demo.
 */
export function citasStore(): CitasStore | null {
  const cfg = supabaseConfig();
  if (cfg) return new SupabaseStore(cfg.url, cfg.key);
  if (process.env.NODE_ENV !== 'production') return (global.__atiendeCitas ??= new MemoryStore());
  return null;
}
