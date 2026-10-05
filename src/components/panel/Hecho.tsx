'use client';

import { Check } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Marca una solicitud o incidencia como hecha, o la devuelve a pendiente. */
export function Hecho({ api, hecho }: { api: string; hecho: boolean }) {
  const router = useRouter();
  const [estado, setEstado] = useState(hecho);
  const [ocupado, setOcupado] = useState(false);

  async function cambiar() {
    const nuevo = !estado;
    setEstado(nuevo);
    setOcupado(true);
    try {
      const res = await fetch(api, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevo ? 'hecho' : 'pendiente' }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setEstado(!nuevo);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      disabled={ocupado}
      aria-pressed={estado}
      className={`press inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-2 text-sm font-semibold shadow-btn transition-colors duration-150 disabled:opacity-60 ${
        estado ? 'border-ok bg-[color-mix(in_oklch,var(--ok)_14%,white)] text-ink' : 'border-line-strong bg-surface text-ink'
      }`}
    >
      <Check size={16} weight="bold" className={estado ? 'text-ok' : ''} aria-hidden />
      {estado ? 'Hecho' : 'Marcar hecho'}
    </button>
  );
}
