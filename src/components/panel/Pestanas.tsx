'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Pestanas({
  base,
  citas,
  registros,
  pendientes,
}: {
  base: string;
  citas: boolean;
  registros: string;
  pendientes: number;
}) {
  const ruta = usePathname();
  const pestanas = [
    { href: base, texto: 'Conversaciones', activa: ruta === base || ruta.startsWith(`${base}/c/`) },
    ...(citas ? [{ href: `${base}/citas`, texto: 'Citas', activa: ruta === `${base}/citas` }] : []),
    { href: `${base}/solicitudes`, texto: registros, activa: ruta === `${base}/solicitudes`, cuenta: pendientes },
    { href: `${base}/resumen`, texto: 'Resumen', activa: ruta === `${base}/resumen` },
  ];

  return (
    <nav aria-label="Secciones del panel" className="mx-auto max-w-3xl overflow-x-auto px-1.5">
      <ul className="flex">
        {pestanas.map((p) => (
          <li key={p.href} className="shrink-0">
            <Link
              href={p.href}
              aria-current={p.activa ? 'page' : undefined}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-3 text-[15px] max-[400px]:px-2 max-[400px]:text-[14px] font-medium transition-colors duration-150 ${
                p.activa ? 'text-cobalt-text' : 'text-muted [@media(hover:hover)]:hover:text-ink'
              }`}
            >
              {p.texto}
              {!!p.cuenta && (
                <span className="rounded-full bg-cobalt px-1.5 font-mono text-xs font-semibold tabular-nums leading-5 text-cobalt-on">
                  {p.cuenta}
                </span>
              )}
              {p.activa && <span aria-hidden className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-cobalt" />}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
