import type { Metadata } from 'next';
import { PanelSummary } from '@/components/chat/Panel';
import type { Message } from '@/components/chat/useChat';
import { Cta } from '@/components/Cta';
import { LandingDemo } from '@/components/LandingDemo';
import { contactWhatsapp, requestDemoLink } from '@/lib/contact';
import { textos } from '@/lib/entidad';
import { getPueblo } from '@/lib/pueblo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Atentia · Asistente 24 horas para autoescuelas y academias',
  description:
    'Un asistente que contesta precios, horarios y matrícula por WhatsApp y en tu web, a cualquier hora, y te pasa cada interesado para que le llames.',
};

const EJEMPLO = 'autoescuela-ejemplo';

// Datos de ejemplo para enseñar el panel. Se marcan como tales en la página.
const panelEjemplo: Message[] = [
  { role: 'user', content: '¿Cuánto cuesta el carné B?', at: Date.parse('2026-10-05T20:41:00Z') },
  { role: 'assistant', content: 'Matrícula y teórico, 150 €. Cada práctica, 32 €.', at: Date.parse('2026-10-05T20:41:04Z') },
  { role: 'user', content: '¿Hay clases teóricas por la tarde?', at: Date.parse('2026-10-05T21:30:00Z') },
  { role: 'assistant', content: 'Sí, lunes, miércoles y viernes a las 19:00.', at: Date.parse('2026-10-05T21:30:03Z') },
  { role: 'user', content: 'Quiero apuntarme, ¿me llamáis el lunes por la tarde?', at: Date.parse('2026-10-05T23:12:00Z') },
  {
    role: 'assistant',
    content:
      '[[SOLICITUD: Carné B | Lunes por la tarde | Quiere matricularse y que le llamen]]\nQueda registrada.',
    at: Date.parse('2026-10-05T23:12:05Z'),
  },
];

const pasos = [
  ['Leemos tu web', 'Precios, permisos, cursos, horarios y matrícula. Con eso preparamos lo que sabe el asistente.'],
  ['Tú lo revisas', 'Solo responde con lo que tú apruebas. Lo que no sabe, lo deriva a tu teléfono.'],
  ['Te llegan alumnos', 'Contesta por WhatsApp y en tu web a cualquier hora, y te pasa cada interesado para que le llames.'],
] as const;

const garantias = [
  ['69 € al mes', 'Primer mes gratis y sin permanencia. Con WhatsApp, 99 € al mes.'],
  ['Se paga con un alumno', 'Un alumno más al mes cubre de sobra la cuota.'],
  ['No se inventa nada', 'No da precios ni ofertas que no le hayas dado. Si no lo sabe, remite a tu teléfono.'],
  ['Tu información, tu control', 'Cambias precios, horarios y ofertas cuando quieras.'],
] as const;

export default async function Empresas() {
  const ejemplo = await getPueblo(EJEMPLO);
  const demoHref =
    requestDemoLink(
      { email: process.env.NEXT_PUBLIC_CONTACT_EMAIL, whatsapp: contactWhatsapp() },
      'negocio'
    ) ?? `/${EJEMPLO}`;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <div className="min-h-[100dvh]">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="/empresas" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-cobalt text-[15px] text-cobalt-on ring-1 ring-inset ring-white/20"
          >
            A
          </span>
          Atentia
        </a>
        <Cta href={demoHref} className="bg-ink px-4 py-2 text-sm text-canvas" />
      </header>

      <main>
        {/* Primera pantalla: la propuesta y el producto funcionando. */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.15fr_1fr] md:gap-14 md:pt-14">
          <div className="max-w-xl">
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-[3.25rem]">
              Tu autoescuela o academia, contestando a cualquier hora.
            </h1>
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-muted">
              Un asistente que responde precios, horarios y matrícula por WhatsApp y en tu web, y te pasa
              cada interesado para que le llames.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Cta href={demoHref} className="bg-cobalt text-cobalt-on [@media(hover:hover)]:hover:bg-cobalt-strong" />
              <a
                href={`/${EJEMPLO}`}
                className="font-medium text-cobalt-text underline decoration-1 underline-offset-4"
              >
                Abrir el ejemplo
              </a>
            </div>
          </div>

          {ejemplo && (
            <LandingDemo
              slug={ejemplo.slug}
              nombre={ejemplo.nombre}
              sugerencias={ejemplo.sugerencias}
              textos={textos(ejemplo)}
            />
          )}
        </section>

        {/* Cómo se pone en marcha. */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Listo en 48 horas, sin instalar nada.
            </h2>
            <ol className="mt-12 divide-y divide-[var(--line)] border-y border-line">
              {pasos.map(([titulo, texto]) => (
                <li key={titulo} className="grid gap-2 py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-10">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em] text-cobalt-text">{titulo}</h3>
                  <p className="max-w-[60ch] text-lg leading-relaxed text-muted">{texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Lo que gana el negocio: el panel de verdad, con datos de ejemplo. */}
        <section className="bg-sunken">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1fr_1.1fr] md:items-start">
            <div className="max-w-md md:sticky md:top-10">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Cada interesado, una llamada.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Quien pregunta a las once de la noche no se va a la autoescuela de al lado: deja su
                solicitud y te llega al momento para que le llames por la mañana.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                Cada mes, un informe con lo que más te preguntan y las dudas que tu web no resolvía.
              </p>
            </div>
            <figure className="rounded-[22px] border border-line bg-canvas p-5 shadow-soft sm:p-6">
              <figcaption className="mb-5 flex items-baseline justify-between gap-3">
                <span className="font-semibold">Tu panel</span>
                <span className="text-sm text-muted">Datos de ejemplo</span>
              </figcaption>
              <PanelSummary messages={panelEjemplo} clase="solicitud" />
            </figure>
          </div>
        </section>

        {/* Confianza: las dudas de un dueño de negocio. */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Pensado para un negocio pequeño.
          </h2>
          <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {garantias.map(([titulo, texto]) => (
              <div key={titulo} className="border-t-2 border-cobalt pt-5">
                <dt className="text-lg font-semibold">{titulo}</dt>
                <dd className="mt-2 max-w-[48ch] leading-relaxed text-muted">{texto}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Cierre. */}
        <section className="bg-cobalt text-cobalt-on">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 py-20 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Pruébalo con tu negocio.
              </h2>
              <p className="mt-4 text-lg leading-relaxed opacity-85">
                Te preparamos la demo con tu web, sin compromiso.
              </p>
            </div>
            <Cta href={demoHref} className="bg-cobalt-on text-[var(--cobalt)]" />
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted sm:flex-row sm:justify-between">
        <p>Atentia. Asistente 24 horas para autoescuelas y academias.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <a href="/" className="underline">
            Para ayuntamientos
          </a>
          {email && (
            <a href={`mailto:${email}`} className="underline">
              {email}
            </a>
          )}
          <a href="/privacidad" className="underline">
            Privacidad
          </a>
          <a href="/aviso-legal" className="underline">
            Aviso legal
          </a>
        </nav>
      </footer>
    </div>
  );
}
