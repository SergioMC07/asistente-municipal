// Entrada al panel: sin sesión, a pedir el enlace; con un negocio, directo a
// él; con varios (una gestoría que lleva dos centros), a elegir.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CaretRight } from '@phosphor-icons/react/dist/ssr';
import { Escudo } from '@/components/chat/Escudo';
import { textos } from '@/lib/entidad';
import { sesionActual } from '@/lib/panel/sesion';

export const dynamic = 'force-dynamic';

export default async function Panel() {
  const sesion = await sesionActual();
  if (!sesion) redirect('/panel/entrar');
  if (sesion.negocios.length === 1) redirect(`/panel/${sesion.negocios[0].slug}`);

  return (
    <main className="min-h-[100dvh] bg-[var(--fondo)] px-4 py-14">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">¿Qué panel quieres ver?</h1>
        <p className="mt-2 text-muted">Has entrado como {sesion.email}.</p>
        <ul className="mt-6 space-y-3">
          {sesion.negocios.map((n) => (
            <li key={n.slug}>
              <Link
                href={`/panel/${n.slug}`}
                className="press flex items-center gap-3 rounded-[18px] border-[1.5px] border-line-strong bg-surface p-4 shadow-btn"
              >
                <Escudo nombre={n.nombre} url={n.escudoUrl} />
                <span className="min-w-0 flex-1 truncate font-semibold">{textos(n).titulo}</span>
                <CaretRight size={18} weight="bold" className="text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
