'use client';

import { useEffect, useState } from 'react';

/**
 * Hora local del vecino. Se calcula solo en el navegador: el servidor está en
 * otra zona horaria y daría una hora distinta al hidratar la página.
 */
export function Hora({ at, className = '' }: { at: number; className?: string }) {
  const [text, setText] = useState('');
  useEffect(() => {
    setText(new Date(at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
  }, [at]);
  return (
    <time dateTime={new Date(at).toISOString()} className={`font-mono tabular-nums ${className}`}>
      {text || ' '}
    </time>
  );
}
