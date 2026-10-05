import { PanelSummary } from '@/components/chat/Panel';
import type { Message } from '@/components/chat/useChat';
import { Cta } from '@/components/Cta';
import { LandingDemo } from '@/components/LandingDemo';
import { contactWhatsapp, requestDemoLink } from '@/lib/contact';
import { textos } from '@/lib/entidad';
import { getPueblo } from '@/lib/pueblo';

export const dynamic = 'force-dynamic';

const EJEMPLO = 'villaejemplo';

// Datos de ejemplo para enseñar el panel. Se marcan como tales en la página.
const panelEjemplo: Message[] = [
  { role: 'user', content: '¿A qué hora abre el registro?', at: Date.parse('2026-10-05T19:42:00Z') },
  { role: 'assistant', content: 'Lunes a viernes de 9:00 a 14:00.', at: Date.parse('2026-10-05T19:42:05Z') },
  { role: 'user', content: '¿Cuándo pasa la recogida de enseres?', at: Date.parse('2026-10-05T21:15:00Z') },
  { role: 'assistant', content: 'El primer martes de cada mes.', at: Date.parse('2026-10-05T21:15:04Z') },
  { role: 'user', content: 'La farola de la calle Mayor, 12 no se enciende', at: Date.parse('2026-10-05T22:03:00Z') },
  {
    role: 'assistant',
    content:
      '[[INCIDENCIA: Farola fundida | Calle Mayor, 12 | No se enciende por la noche]]\nQueda registrada.',
    at: Date.parse('2026-10-05T22:03:06Z'),
  },
];

const pasos = [
  ['Leemos su web', 'Horarios, trámites, tasas, servicios y fiestas. Con eso preparamos la ficha del municipio.'],
  ['Ustedes la revisan', 'El asistente solo responde con lo que el ayuntamiento aprueba. Lo que no sabe, lo deriva a la oficina.'],
  ['Los vecinos preguntan', 'Por WhatsApp o en la web municipal, a cualquier hora y en su idioma.'],
] as const;

const garantias = [
  ['Contrato menor', 'Desde 99 € al mes, sin licitación ni permanencia. Un mes de prueba gratis.'],
  ['Datos en Europa', 'Contrato de encargado de tratamiento y conversaciones guardadas en la UE.'],
  ['Sabe cuándo callar', 'No da asesoramiento jurídico ni inventa datos. En emergencias, remite al 112.'],
  ['Su información, su control', 'El ayuntamiento revisa y corrige lo que responde el asistente.'],
] as const;

export default async function Home() {
  const ejemplo = await getPueblo(EJEMPLO);
  const demoHref =
    requestDemoLink({
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
      whatsapp: contactWhatsapp(),
    }) ?? `/${EJEMPLO}`;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <div className="min-h-[100dvh]">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
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
              Su ayuntamiento, abierto a cualquier hora.
            </h1>
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-muted">
              Un asistente que responde a los vecinos por WhatsApp y en la web, con la información de su
              municipio.
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

        {/* Cómo se pone en marcha: tres verbos, sin tarjetas. */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Listo en 48 horas, sin proyectos largos.
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

        {/* Lo que gana el ayuntamiento: el panel de verdad, con datos de ejemplo. */}
        <section className="bg-sunken">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1fr_1.1fr] md:items-start">
            <div className="max-w-md md:sticky md:top-10">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Sabrá qué preguntan sus vecinos.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Cada consulta y cada incidencia llegan al panel del ayuntamiento. Las incidencias entran
                con número de registro y avisan al servicio que corresponda.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                Cada mes, un informe con los temas más consultados y las dudas que la web no resolvía.
              </p>
            </div>
            <figure className="rounded-[22px] border border-line bg-canvas p-5 shadow-soft sm:p-6">
              <figcaption className="mb-5 flex items-baseline justify-between gap-3">
                <span className="font-semibold">Panel del ayuntamiento</span>
                <span className="text-sm text-muted">Datos de ejemplo</span>
              </figcaption>
              <PanelSummary messages={panelEjemplo} />
            </figure>
          </div>
        </section>

        {/* Confianza: cuatro respuestas a las dudas de un secretario. */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Pensado para un ayuntamiento.
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

        {/* Cierre: el color del azulejo ocupa toda la banda. */}
        <section className="bg-cobalt text-cobalt-on">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 py-20 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Véalo con su municipio.
              </h2>
              <p className="mt-4 text-lg leading-relaxed opacity-85">
                Le preparamos la demo con la web de su ayuntamiento, sin compromiso.
              </p>
            </div>
            <Cta href={demoHref} className="bg-cobalt-on text-[var(--cobalt)]" />
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted sm:flex-row sm:justify-between">
        <p>Atentia. Asistente municipal 24 horas.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
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
