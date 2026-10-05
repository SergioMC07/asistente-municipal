import type { Metadata } from 'next';
import { GestionApp } from '@/components/GestionApp';
import { Escudo } from '@/components/chat/Escudo';
import { tokenValido } from '@/lib/citas/gestion';
import { datosAgenda } from '@/lib/citas/vista';
import { textos } from '@/lib/entidad';
import { marcaStyle } from '@/lib/marca';
import { getPueblo } from '@/lib/pueblo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agenda de citas · Atiende',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type Props = { params: { slug: string }; searchParams: { t?: string } };

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="mx-auto max-w-md px-5 py-20">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">{titulo}</h1>
      <p className="mt-3 leading-relaxed text-muted">{texto}</p>
    </main>
  );
}

export default async function Gestion({ params, searchParams }: Props) {
  const pueblo = await getPueblo(params.slug);
  if (!pueblo || !tokenValido(pueblo, searchParams.t)) {
    return <Aviso titulo="Enlace no válido" texto="Revisa que has copiado el enlace completo o pide uno nuevo." />;
  }
  const datos = await datosAgenda(pueblo);
  if (datos.estado !== 'real') {
    return (
      <Aviso
        titulo="Agenda en modo demostración"
        texto="Las citas de esta agenda todavía se simulan. Cuando se active, aquí verás las citas reales y podrás gestionarlas."
      />
    );
  }

  const t = textos(pueblo);
  return (
    <div style={marcaStyle(pueblo.color)} className="min-h-[100dvh] bg-[var(--fondo)]">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
          <Escudo nombre={pueblo.nombre} url={pueblo.escudoUrl} />
          <div className="min-w-0">
            <h1 className="truncate font-semibold leading-tight">{t.titulo}</h1>
            <p className="text-sm text-muted">Agenda de citas</p>
          </div>
        </div>
      </header>
      <main>
        <GestionApp
          api={`/api/gestion/${pueblo.slug}?t=${encodeURIComponent(searchParams.t!)}`}
          feed={`/api/gestion/${pueblo.slug}/calendario?t=${encodeURIComponent(searchParams.t!)}`}
          datos={datos}
        />
      </main>
    </div>
  );
}
