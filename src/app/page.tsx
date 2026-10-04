const contacto = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const ventajas = [
  ['A cualquier hora', 'Responde horarios, trámites, tasas y servicios por la noche y los fines de semana.'],
  ['Menos llamadas a la oficina', 'Las preguntas de siempre se resuelven solas y el personal se dedica a lo importante.'],
  ['Incidencias ordenadas', 'Baches, farolas o basura: recoge qué pasa y dónde, y avisa a la brigada.'],
  ['Listo en 48 horas', 'Se prepara con la información de vuestra web, sin proyectos largos ni licitaciones.'],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <p className="text-sm font-medium text-municipal-brand">Para ayuntamientos</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
        Un asistente que atiende a tus vecinos las 24 horas
      </h1>
      <p className="mt-4 text-lg text-municipal-muted">
        Por WhatsApp, en la web o por teléfono. Con la información de vuestro ayuntamiento y sin
        horarios de oficina.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {ventajas.map(([titulo, texto]) => (
          <li key={titulo} className="rounded-xl border border-municipal-line bg-white p-5">
            <h2 className="font-semibold">{titulo}</h2>
            <p className="mt-1 text-municipal-muted">{texto}</p>
          </li>
        ))}
      </ul>

      {contacto && (
        <p className="mt-10">
          ¿Quieres verlo con tu municipio?{' '}
          <a href={`mailto:${contacto}`} className="font-medium text-municipal-brand underline">
            {contacto}
          </a>
        </p>
      )}
    </main>
  );
}
