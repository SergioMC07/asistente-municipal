// ============================================
// Conversaciones, mensajes y registros (solicitudes e incidencias)
// ============================================
// Solo se guardan las de clientes reales (fichas con panel), nunca las demos.
// La clave de una conversación es (slug, id): aunque alguien adivinara el id
// de otra, con otro slug crearía una conversación distinta.

import type { Clase } from '@/lib/entidad';
import { supabase, supabaseConfig, supabaseLista } from '@/lib/supabase';

export type Canal = 'web' | 'whatsapp';

export type Conversacion = {
  id: string;
  slug: string;
  canal: Canal;
  /** Teléfono de WhatsApp del cliente; en la web, null. */
  cliente: string | null;
  nombre: string | null;
  primera: string | null;
  ultima: string | null;
  tiene_cita: boolean;
  tiene_registro: boolean;
  sin_respuesta: boolean;
  /** La última pregunta que el asistente no supo responder. */
  pregunta_sin_respuesta: string | null;
  creada: string;
  actualizada: string;
  mensajes: number;
};

export type Mensaje = {
  slug: string;
  conversacion_id: string;
  rol: 'user' | 'assistant' | 'humano';
  contenido: string;
  creado: string;
};

export type Registro = {
  id: string;
  slug: string;
  conversacion_id: string | null;
  clase: Clase;
  tipo: string;
  lugar: string;
  detalle: string;
  nombre: string | null;
  telefono: string | null;
  estado: 'pendiente' | 'hecho';
  creado: string;
};

export type Turno = {
  slug: string;
  conversacionId: string;
  canal: Canal;
  cliente?: string | null;
  nombre?: string | null;
  /** Primer mensaje del cliente en esta conversación. */
  esPrimera: boolean;
  usuario: string;
  respuesta: string;
  senales: { cita: boolean; registro: boolean; sinRespuesta: boolean };
  ahora: Date;
};

export interface PanelStore {
  guardarTurno(t: Turno): Promise<void>;
  conversaciones(slug: string, desde: Date, limite?: number): Promise<Conversacion[]>;
  conversacion(slug: string, id: string): Promise<{ conversacion: Conversacion; mensajes: Mensaje[] } | null>;
  registrar(r: Omit<Registro, 'id' | 'estado' | 'creado'>): Promise<Registro>;
  registros(slug: string, desde: Date): Promise<Registro[]>;
  marcarRegistro(slug: string, id: string, estado: Registro['estado']): Promise<boolean>;
}

const q = (v: string) => encodeURIComponent(v);

// ---------- Supabase ----------

class SupabasePanel implements PanelStore {
  constructor(private cfg: { url: string; key: string }) {}

  async guardarTurno(t: Turno) {
    const ahora = t.ahora.toISOString();
    // Upsert: solo se envían las columnas que deben cambiar. Las señales solo
    // se envían cuando son ciertas, para no borrar una cita de un turno anterior.
    const conversacion: Record<string, unknown> = {
      slug: t.slug,
      id: t.conversacionId,
      canal: t.canal,
      ultima: t.usuario.slice(0, 300),
      actualizada: ahora,
      ...(t.cliente ? { cliente: t.cliente } : {}),
      ...(t.nombre ? { nombre: t.nombre } : {}),
      ...(t.esPrimera ? { primera: t.usuario.slice(0, 300), creada: ahora } : {}),
      ...(t.senales.cita ? { tiene_cita: true } : {}),
      ...(t.senales.registro ? { tiene_registro: true } : {}),
      ...(t.senales.sinRespuesta
        ? { sin_respuesta: true, pregunta_sin_respuesta: t.usuario.slice(0, 300) }
        : {}),
    };
    const res = await supabase(this.cfg, 'conversaciones?on_conflict=slug,id', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: JSON.stringify(conversacion),
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);

    const despues = new Date(t.ahora.getTime() + 1).toISOString();
    const mensajes: Mensaje[] = [
      { slug: t.slug, conversacion_id: t.conversacionId, rol: 'user', contenido: t.usuario, creado: ahora },
      { slug: t.slug, conversacion_id: t.conversacionId, rol: 'assistant', contenido: t.respuesta, creado: despues },
    ];
    const res2 = await supabase(this.cfg, 'mensajes', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify(mensajes),
    });
    if (!res2.ok) throw new Error(`Supabase ${res2.status}: ${await res2.text()}`);
  }

  async conversaciones(slug: string, desde: Date, limite = 200) {
    const filas = await supabaseLista<Omit<Conversacion, 'mensajes'> & { mensajes: { count: number }[] }>(
      this.cfg,
      `conversaciones?select=*,mensajes(count)&slug=eq.${q(slug)}&actualizada=gte.${desde.toISOString()}&order=actualizada.desc&limit=${limite}`
    );
    return filas.map((f) => ({ ...f, mensajes: f.mensajes?.[0]?.count ?? 0 }));
  }

  async conversacion(slug: string, id: string) {
    const [c] = await supabaseLista<Omit<Conversacion, 'mensajes'>>(
      this.cfg,
      `conversaciones?slug=eq.${q(slug)}&id=eq.${q(id)}`
    );
    if (!c) return null;
    const mensajes = await supabaseLista<Mensaje>(
      this.cfg,
      `mensajes?slug=eq.${q(slug)}&conversacion_id=eq.${q(id)}&order=creado.asc`
    );
    return { conversacion: { ...c, mensajes: mensajes.length }, mensajes };
  }

  async registrar(r: Omit<Registro, 'id' | 'estado' | 'creado'>) {
    const res = await supabase(this.cfg, 'registros', { method: 'POST', body: JSON.stringify(r) });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    return ((await res.json()) as Registro[])[0];
  }

  registros(slug: string, desde: Date) {
    return supabaseLista<Registro>(
      this.cfg,
      `registros?slug=eq.${q(slug)}&creado=gte.${desde.toISOString()}&order=creado.desc`
    );
  }

  async marcarRegistro(slug: string, id: string, estado: Registro['estado']) {
    const res = await supabase(this.cfg, `registros?slug=eq.${q(slug)}&id=eq.${q(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
    return res.ok && ((await res.json()) as unknown[]).length > 0;
  }
}

// ---------- Memoria (desarrollo y tests) ----------

export class MemoryPanel implements PanelStore {
  convs = new Map<string, Omit<Conversacion, 'mensajes'>>();
  msgs: Mensaje[] = [];
  regs: Registro[] = [];
  private n = 0;

  async guardarTurno(t: Turno) {
    const k = `${t.slug}|${t.conversacionId}`;
    const ahora = t.ahora.toISOString();
    const antes = this.convs.get(k);
    this.convs.set(k, {
      id: t.conversacionId,
      slug: t.slug,
      canal: t.canal,
      cliente: t.cliente ?? antes?.cliente ?? null,
      nombre: t.nombre ?? antes?.nombre ?? null,
      primera: antes?.primera ?? t.usuario.slice(0, 300),
      ultima: t.usuario.slice(0, 300),
      tiene_cita: (antes?.tiene_cita ?? false) || t.senales.cita,
      tiene_registro: (antes?.tiene_registro ?? false) || t.senales.registro,
      sin_respuesta: (antes?.sin_respuesta ?? false) || t.senales.sinRespuesta,
      pregunta_sin_respuesta: t.senales.sinRespuesta
        ? t.usuario.slice(0, 300)
        : (antes?.pregunta_sin_respuesta ?? null),
      creada: antes?.creada ?? ahora,
      actualizada: ahora,
    });
    this.msgs.push(
      { slug: t.slug, conversacion_id: t.conversacionId, rol: 'user', contenido: t.usuario, creado: ahora },
      {
        slug: t.slug,
        conversacion_id: t.conversacionId,
        rol: 'assistant',
        contenido: t.respuesta,
        creado: new Date(t.ahora.getTime() + 1).toISOString(),
      }
    );
  }

  private cuenta(slug: string, id: string) {
    return this.msgs.filter((m) => m.slug === slug && m.conversacion_id === id).length;
  }

  async conversaciones(slug: string, desde: Date, limite = 200) {
    return [...this.convs.values()]
      .filter((c) => c.slug === slug && new Date(c.actualizada) >= desde)
      .sort((a, b) => b.actualizada.localeCompare(a.actualizada))
      .slice(0, limite)
      .map((c) => ({ ...c, mensajes: this.cuenta(slug, c.id) }));
  }

  async conversacion(slug: string, id: string) {
    const c = this.convs.get(`${slug}|${id}`);
    if (!c) return null;
    const mensajes = this.msgs.filter((m) => m.slug === slug && m.conversacion_id === id);
    return { conversacion: { ...c, mensajes: mensajes.length }, mensajes };
  }

  async registrar(r: Omit<Registro, 'id' | 'estado' | 'creado'>) {
    const nuevo: Registro = { ...r, id: `r${++this.n}`, estado: 'pendiente', creado: new Date().toISOString() };
    this.regs.push(nuevo);
    return nuevo;
  }

  async registros(slug: string, desde: Date) {
    return this.regs
      .filter((r) => r.slug === slug && new Date(r.creado) >= desde)
      .sort((a, b) => b.creado.localeCompare(a.creado));
  }

  async marcarRegistro(slug: string, id: string, estado: Registro['estado']) {
    const r = this.regs.find((x) => x.slug === slug && x.id === id);
    if (r) r.estado = estado;
    return !!r;
  }
}

const global = globalThis as unknown as { __atiendePanel?: MemoryPanel };

/** Supabase si está configurado; en desarrollo, memoria; en producción sin Supabase, null. */
export function panelStore(): PanelStore | null {
  const cfg = supabaseConfig();
  if (cfg) return new SupabasePanel(cfg);
  if (process.env.NODE_ENV !== 'production') return (global.__atiendePanel ??= new MemoryPanel());
  return null;
}
