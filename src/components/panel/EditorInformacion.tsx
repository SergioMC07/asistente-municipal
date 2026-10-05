'use client';

import {
  ArrowCounterClockwise,
  ArrowSquareOut,
  ArrowsClockwise,
  Link as LinkIcon,
  Plus,
  Trash,
} from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import type { Enlace } from '@/lib/panel/informacion';
import { cuando } from '@/lib/panel/formato';

type Seccion = { id: number; titulo: string; texto: string };

let siguienteId = 0;

/** La ficha en markdown, partida por sus apartados «## …». */
export function partir(ficha: string): Seccion[] {
  const trozos = ficha.split(/^## /m);
  const secciones: Seccion[] = [];
  trozos.forEach((t, i) => {
    if (i === 0) {
      if (t.trim()) secciones.push({ id: siguienteId++, titulo: '', texto: t.trim() });
      return;
    }
    const [titulo, ...resto] = t.split('\n');
    secciones.push({ id: siguienteId++, titulo: titulo.trim(), texto: resto.join('\n').trim() });
  });
  return secciones;
}

export function unir(secciones: Seccion[]): string {
  return secciones
    .filter((s) => s.titulo.trim() || s.texto.trim())
    .map((s) => (s.titulo.trim() ? `## ${s.titulo.trim()}\n${s.texto.trim()}` : s.texto.trim()))
    .join('\n\n');
}

function Bloque({ titulo, texto, children }: { titulo: string; texto?: string; children: ReactNode }) {
  return (
    <section className="rounded-[18px] border-[1.5px] border-line-strong bg-surface p-5 shadow-soft">
      <h2 className="text-lg font-semibold tracking-[-0.01em]">{titulo}</h2>
      {texto && <p className="mt-1 text-sm leading-relaxed text-muted">{texto}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const campo =
  'w-full rounded-xl border-[1.5px] border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted focus:border-cobalt focus-visible:outline-none';
const botonSecundario =
  'press inline-flex items-center justify-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold shadow-btn disabled:opacity-50';

// Alto según el texto, contando las líneas largas que ocupan varias en el móvil.
const filas = (texto: string) =>
  Math.min(24, Math.max(3, texto.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 36)), 1)));

export function EditorInformacion(props: {
  api: string;
  chat: string;
  demo: boolean;
  ficha: string;
  telefono: string;
  email: string;
  horario: string;
  enlaces: Enlace[];
  puedeDeshacer: boolean;
  actualizada: { cuando: string; quien: string } | null;
}) {
  const router = useRouter();
  const [secciones, setSecciones] = useState(() => partir(props.ficha));
  const [contacto, setContacto] = useState({ telefono: props.telefono, email: props.email, horario: props.horario });
  const [cambiado, setCambiado] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [nuevoEnlace, setNuevoEnlace] = useState('');

  async function enviar(cuerpo: Record<string, unknown>, ok: string, clave: string): Promise<boolean> {
    setOcupado(clave);
    setMensaje(null);
    try {
      const res = await fetch(props.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'No se ha podido guardar. Prueba otra vez.');
      setMensaje({ ok: true, texto: ok });
      router.refresh();
      return true;
    } catch (err) {
      setMensaje({ ok: false, texto: err instanceof Error ? err.message : 'No se ha podido guardar.' });
      return false;
    } finally {
      setOcupado(null);
    }
  }

  const cambiarSeccion = (id: number, cambio: Partial<Seccion>) => {
    setSecciones((s) => s.map((x) => (x.id === id ? { ...x, ...cambio } : x)));
    setCambiado(true);
  };

  async function guardar() {
    const ok = await enviar(
      {
        accion: 'guardar',
        ficha: unir(secciones),
        telefono: contacto.telefono.trim() || null,
        email: contacto.email.trim() || null,
        horario: contacto.horario.trim() || null,
      },
      'Guardado. Tu asistente lo usará en menos de un minuto.',
      'guardar'
    );
    if (ok) setCambiado(false);
  }

  async function deshacer() {
    if (!window.confirm('¿Volver a la versión anterior de tu información?')) return;
    if (await enviar({ accion: 'deshacer' }, 'Has vuelto a la versión anterior.', 'deshacer')) {
      // La página trae la ficha anterior; se recarga para partirla de nuevo.
      window.location.reload();
    }
  }

  async function anadirEnlace(e: FormEvent) {
    e.preventDefault();
    const ok = await enviar(
      { accion: 'enlace', url: nuevoEnlace },
      'Enlace leído. Tu asistente ya sabe lo que pone.',
      'enlace'
    );
    if (ok) setNuevoEnlace('');
  }

  return (
    <div className="space-y-5 pb-24">
      {props.actualizada && (
        <p className="text-sm text-muted">
          Último cambio: {cuando(props.actualizada.cuando)}, por {props.actualizada.quien}.
        </p>
      )}

      <Bloque titulo="Contacto" texto="Se muestran junto al chat y el asistente los da cuando se los piden.">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Teléfono</span>
            <input
              className={`${campo} mt-1.5`}
              value={contacto.telefono}
              inputMode="tel"
              onChange={(e) => {
                setContacto({ ...contacto, telefono: e.target.value });
                setCambiado(true);
              }}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              className={`${campo} mt-1.5`}
              value={contacto.email}
              inputMode="email"
              onChange={(e) => {
                setContacto({ ...contacto, email: e.target.value });
                setCambiado(true);
              }}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Horario</span>
            <input
              className={`${campo} mt-1.5`}
              value={contacto.horario}
              placeholder="Lunes a viernes, de 10:00 a 14:00 y de 16:00 a 20:00"
              onChange={(e) => {
                setContacto({ ...contacto, horario: e.target.value });
                setCambiado(true);
              }}
            />
          </label>
        </div>
      </Bloque>

      <Bloque
        titulo="Lo que sabe tu asistente"
        texto="Escribe como se lo contarías a un cliente: precios, cursos, requisitos, ofertas… Una línea por dato, empezando con «- ». No se inventa nada que no esté aquí."
      >
        <div className="space-y-4">
          {secciones.map((s) => (
            <div key={s.id} className="rounded-xl border border-line bg-canvas p-3.5">
              <div className="flex items-center gap-2">
                <input
                  aria-label="Título del apartado"
                  className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 font-semibold text-ink placeholder:text-muted focus:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                  value={s.titulo}
                  placeholder="Apartado (p. ej. Precios)"
                  onChange={(e) => cambiarSeccion(s.id, { titulo: e.target.value })}
                />
                <button
                  type="button"
                  aria-label={`Quitar el apartado ${s.titulo}`}
                  onClick={() => {
                    if (!s.texto.trim() || window.confirm(`¿Quitar el apartado «${s.titulo || 'sin título'}»?`)) {
                      setSecciones((x) => x.filter((y) => y.id !== s.id));
                      setCambiado(true);
                    }
                  }}
                  className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted [@media(hover:hover)]:hover:bg-sunken [@media(hover:hover)]:hover:text-danger"
                >
                  <Trash size={18} aria-hidden />
                </button>
              </div>
              <textarea
                aria-label={`Contenido de ${s.titulo || 'este apartado'}`}
                className={`${campo} mt-2 resize-y text-[15px] leading-relaxed`}
                rows={filas(s.texto)}
                value={s.texto}
                onChange={(e) => cambiarSeccion(s.id, { texto: e.target.value })}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setSecciones((s) => [...s, { id: siguienteId++, titulo: '', texto: '- ' }]);
              setCambiado(true);
            }}
            className={botonSecundario}
          >
            <Plus size={16} weight="bold" aria-hidden />
            Añadir apartado
          </button>
        </div>
      </Bloque>

      <Bloque
        titulo="Enlaces"
        texto="Pega páginas de tu web (precios, cursos, horarios). El asistente lee lo que ponen y lo usa para responder. Si cambias la página, pulsa «Volver a leer»."
      >
        {props.enlaces.length > 0 && (
          <ul className="mb-4 space-y-3">
            {props.enlaces.map((e) => (
              <li key={e.url} className="rounded-xl border border-line bg-canvas p-3.5">
                <div className="flex items-start gap-2.5">
                  <LinkIcon size={18} weight="bold" className="mt-0.5 shrink-0 text-cobalt-text" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{e.titulo}</p>
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm text-cobalt-text underline"
                    >
                      {e.url}
                    </a>
                    <p className="mt-0.5 text-xs text-muted">Leído: {cuando(e.leido)}</p>
                  </div>
                </div>
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer font-medium text-muted">Lo que ha aprendido</summary>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed">{e.resumen}</p>
                </details>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!!ocupado}
                    onClick={() => enviar({ accion: 'releer', url: e.url }, 'Enlace leído de nuevo.', e.url)}
                    className={botonSecundario}
                  >
                    <ArrowsClockwise size={16} weight="bold" aria-hidden />
                    {ocupado === e.url ? 'Leyendo…' : 'Volver a leer'}
                  </button>
                  <button
                    type="button"
                    disabled={!!ocupado}
                    onClick={() => enviar({ accion: 'quitar', url: e.url }, 'Enlace quitado.', `quitar-${e.url}`)}
                    className={botonSecundario}
                  >
                    <Trash size={16} aria-hidden />
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={anadirEnlace} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            required
            inputMode="url"
            placeholder="https://tuweb.es/precios"
            aria-label="Dirección de la página"
            value={nuevoEnlace}
            onChange={(e) => setNuevoEnlace(e.target.value)}
            className={campo}
          />
          <button
            type="submit"
            disabled={!!ocupado}
            className="press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-cobalt px-4 py-2.5 font-semibold text-cobalt-on shadow-btn disabled:opacity-50"
          >
            <Plus size={16} weight="bold" aria-hidden />
            {ocupado === 'enlace' ? 'Leyendo la página…' : 'Añadir enlace'}
          </button>
        </form>
      </Bloque>

      <div className="flex flex-wrap gap-2">
        <a href={props.chat} target="_blank" className={botonSecundario}>
          <ArrowSquareOut size={16} weight="bold" aria-hidden />
          Probar mi asistente
        </a>
        {props.puedeDeshacer && (
          <button type="button" onClick={deshacer} disabled={!!ocupado} className={botonSecundario}>
            <ArrowCounterClockwise size={16} weight="bold" aria-hidden />
            Volver a la versión anterior
          </button>
        )}
      </div>

      {/* Barra fija: el botón de guardar siempre a mano, también en el móvil. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <p
            role="status"
            className={`min-w-0 flex-1 text-sm ${mensaje ? (mensaje.ok ? 'text-cobalt-text' : 'text-danger') : 'text-muted'}`}
          >
            {mensaje?.texto ??
              (props.demo
                ? 'Demostración: puedes probar a editar, pero no se guarda.'
                : cambiado
                  ? 'Tienes cambios sin guardar.'
                  : 'Todo guardado.')}
          </p>
          <button
            type="button"
            onClick={guardar}
            disabled={!!ocupado || (!cambiado && !props.demo)}
            className="press shrink-0 rounded-full bg-cobalt px-5 py-2.5 font-semibold text-cobalt-on shadow-btn disabled:opacity-50"
          >
            {ocupado === 'guardar' ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
