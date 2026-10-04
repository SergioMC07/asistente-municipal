import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Chat } from '@/components/Chat';
import { getPueblo } from '@/lib/pueblo';

export const dynamic = 'force-dynamic';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pueblo = await getPueblo(params.slug);
  return { title: pueblo ? `Asistente 24 horas · ${pueblo.nombre}` : 'Asistente no encontrado' };
}

function Escudo({ nombre, url }: { nombre: string; url?: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={`Escudo de ${nombre}`} className="h-11 w-11 object-contain" />;
  }
  const iniciales = nombre
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-municipal-brand font-semibold text-white">
      {iniciales || nombre[0]?.toUpperCase()}
    </div>
  );
}

export default async function PuebloPage({ params }: Props) {
  const pueblo = await getPueblo(params.slug);
  if (!pueblo) notFound();

  const fecha = new Date(pueblo.generadoEl).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="mx-auto flex h-[100dvh] max-w-2xl flex-col bg-municipal-paper sm:border-x sm:border-municipal-line">
      <header className="flex items-center gap-3 border-b border-municipal-line bg-white px-4 py-3">
        <Escudo nombre={pueblo.nombre} url={pueblo.escudoUrl} />
        <div className="min-w-0">
          <h1 className="truncate font-semibold">Ayuntamiento de {pueblo.nombre}</h1>
          <p className="text-sm text-municipal-muted">Asistente 24 horas · Demostración</p>
        </div>
      </header>

      <Chat slug={pueblo.slug} nombre={pueblo.nombre} sugerencias={pueblo.sugerencias} />

      <footer className="border-t border-municipal-line bg-white px-4 pb-3 text-center text-xs text-municipal-muted">
        Asistente automático: puede equivocarse. Información extraída de{' '}
        <a href={pueblo.web} target="_blank" rel="noopener noreferrer" className="underline">
          la web municipal
        </a>{' '}
        el {fecha}. Emergencias: 112.
      </footer>
    </main>
  );
}
