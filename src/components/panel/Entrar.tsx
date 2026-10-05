'use client';

import { EnvelopeSimple, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { useState, type FormEvent } from 'react';

export function Entrar({ caducado }: { caducado: boolean }) {
  const [estado, setEstado] = useState<'inicio' | 'enviando' | 'enviado'>('inicio');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [enlace, setEnlace] = useState<string | null>(null);

  async function pedir(e: FormEvent) {
    e.preventDefault();
    setEstado('enviando');
    setError(null);
    try {
      const res = await fetch('/api/panel/acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; enlace?: string };
      if (!res.ok) throw new Error(data.error ?? 'No se ha podido enviar. Prueba otra vez.');
      setEnlace(data.enlace ?? null);
      setEstado('enviado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido enviar. Prueba otra vez.');
      setEstado('inicio');
    }
  }

  if (estado === 'enviado') {
    return (
      <div className="mt-8 rounded-[18px] border-[1.5px] border-line-strong bg-surface p-5 shadow-soft" role="status">
        <EnvelopeSimple size={28} weight="duotone" className="text-cobalt-text" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold">Revisa tu correo</h2>
        <p className="mt-1.5 leading-relaxed text-muted">
          Si <strong className="font-semibold text-ink">{email}</strong> tiene acceso a un panel, te acaba de llegar un
          enlace para entrar. Caduca en 15 minutos.
        </p>
        {enlace && (
          <a href={enlace} className="mt-4 inline-block text-sm font-semibold text-cobalt-text underline">
            Entrar (enlace de desarrollo)
          </a>
        )}
        <button
          type="button"
          onClick={() => setEstado('inicio')}
          className="mt-4 block text-sm font-medium text-muted underline"
        >
          Usar otro email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={pedir} className="mt-8 space-y-3">
      {caducado && (
        <p className="flex items-start gap-2 rounded-xl bg-surface px-3.5 py-3 text-sm text-ink ring-1 ring-line" role="alert">
          <WarningCircle size={18} weight="bold" className="mt-0.5 shrink-0 text-danger" aria-hidden />
          El enlace ha caducado o ya no es válido. Pide uno nuevo.
        </p>
      )}
      <label className="block">
        <span className="text-sm font-medium">Tu email</span>
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@tunegocio.es"
          className="mt-1.5 w-full rounded-full border-[1.5px] border-line-strong bg-surface px-4 py-3 text-base text-ink placeholder:text-muted focus:border-cobalt focus-visible:outline-none"
        />
      </label>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="press w-full rounded-full bg-cobalt px-4 py-3 font-semibold text-cobalt-on shadow-btn disabled:opacity-60"
      >
        {estado === 'enviando' ? 'Enviando…' : 'Enviarme el enlace'}
      </button>
    </form>
  );
}
