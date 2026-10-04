'use client';

import { PaperPlaneRight } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';

export function Composer({
  onSend,
  disabled,
  className = '',
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  className?: string;
}) {
  const [value, setValue] = useState('');
  const canSend = !disabled && value.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSend) return;
        onSend(value);
        setValue('');
      }}
      className={`flex items-center gap-2 border-t border-line bg-surface px-3 pt-3 ${className}`}
    >
      <label htmlFor="mensaje" className="sr-only">
        Escribe tu pregunta
      </label>
      <input
        id="mensaje"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={1000}
        placeholder="Escribe tu pregunta"
        autoComplete="off"
        enterKeyHint="send"
        className="min-w-0 flex-1 rounded-full border border-line bg-sunken px-4 py-2.5 text-base text-ink outline-none transition-colors duration-150 placeholder:text-muted focus:border-cobalt-text focus:bg-surface focus-visible:outline-none"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Enviar"
        className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cobalt text-cobalt-on disabled:opacity-40"
      >
        <PaperPlaneRight size={20} weight="fill" aria-hidden />
      </button>
    </form>
  );
}
