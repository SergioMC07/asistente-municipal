import type { Metadata } from 'next';
import { GestionApp } from '@/components/GestionApp';
import { Escudo } from '@/components/chat/Escudo';
import { etiquetaHueco, fechaMadrid, huecosLibres } from '@/lib/citas/agenda';
import { tokenValido } from '@/lib/citas/gestion';
import { citasStore } from '@/lib/citas/store';
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
  const agenda = pueblo.citas!;
  const store = citasStore();
  if (agenda.modo !== 'real' || !store) {
    return (
      <Aviso
        titulo="Agenda en modo demostración"
        texto="Las citas de esta agenda todavía se simulan. Cuando se active, aquí verás las citas reales y podrás gestionarlas."
      />
    );
  }

  const ahora = new Date();
  const hasta = new Date(ahora.getTime() + (agenda.dias + 1) * 86_400_000);
  const desdeHoy = new Date(`${fechaMadrid(ahora).fecha}T00:00:00Z`);
  const [citas, bloqueos] = await Promise.all([
    store.confirmadas(pueblo.slug, desdeHoy, hasta),
    store.bloqueos(pueblo.slug, ahora, hasta),
  ]);
  const libres = huecosLibres(agenda, ahora, citas, bloqueos);

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
      <GestionApp
        slug={pueblo.slug}
        token={searchParams.t!}
        citas={citas
          .filter((c) => new Date(c.fin) > ahora)
          .map((c) => ({ ...c, etiqueta: etiquetaHueco(new Date(c.inicio)), dia: fechaMadrid(new Date(c.inicio)).fecha }))}
        bloqueos={bloqueos.map((b) => ({
          ...b,
          etiqueta: `${etiquetaHueco(new Date(b.inicio)).replace(' a las ', ', de ')} a ${fechaMadrid(new Date(b.fin)).hora}`,
        }))}
        libres={libres.map(({ fecha, hora, etiqueta }) => ({ fecha, hora, etiqueta }))}
        hoy={fechaMadrid(ahora).fecha}
      />
    </div>
  );
}
