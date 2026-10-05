import { redirect } from 'next/navigation';
import { SignOut } from '@phosphor-icons/react/dist/ssr';
import { Escudo } from '@/components/chat/Escudo';
import { Pestanas } from '@/components/panel/Pestanas';
import { textos } from '@/lib/entidad';
import { marcaStyle } from '@/lib/marca';
import { almacen } from '@/lib/panel/acceso';
import { hace30 } from '@/lib/panel/formato';
import { negocioDeSesion } from '@/lib/panel/sesion';

export const dynamic = 'force-dynamic';

export default async function NegocioLayout({
  params,
  children,
}: {
  params: { slug: string };
  children: React.ReactNode;
}) {
  const acceso = await negocioDeSesion(params.slug);
  if (!acceso) redirect('/panel/entrar');
  const { negocio, email } = acceso;
  const t = textos(negocio);

  const store = almacen(acceso);
  const pendientes = store
    ? (await store.registros(negocio.slug, hace30())).filter((r) => r.estado === 'pendiente').length
    : 0;

  return (
    <div style={marcaStyle(negocio.color)} className="min-h-[100dvh] bg-[var(--fondo)]">
      {acceso.demo && (
        // Banda de Atentia, en neutro como la de las demos del chat.
        <p className="bg-ink px-4 py-2 text-center text-[13px] leading-snug text-canvas">
          Panel de demostración con datos de ejemplo. Así verá {t.titulo} lo que pasa con su asistente.
        </p>
      )}
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-3.5">
          <Escudo nombre={negocio.nombre} url={negocio.escudoUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{t.titulo}</p>
            <p className="truncate text-sm text-muted">{email ?? 'Demostración'}</p>
          </div>
          <form action="/api/panel/salir" method="post">
            <button
              type="submit"
              className="press inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-surface px-3 py-1.5 text-sm font-medium shadow-btn"
            >
              <SignOut size={16} weight="bold" aria-hidden />
              Salir
            </button>
          </form>
        </div>
        <Pestanas
          base={`/panel/${negocio.slug}`}
          citas={!!negocio.citas}
          registros={t.clase === 'solicitud' ? 'Solicitudes' : 'Incidencias'}
          pendientes={pendientes}
        />
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-5">{children}</main>
    </div>
  );
}
