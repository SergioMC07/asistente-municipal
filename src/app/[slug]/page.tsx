import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { DemoApp } from '@/components/DemoApp';
import { contactWhatsapp } from '@/lib/contact';
import { isRealVisitor, notify } from '@/lib/notify';
import { getPueblo } from '@/lib/pueblo';

export const dynamic = 'force-dynamic';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pueblo = await getPueblo(params.slug);
  if (!pueblo) return { title: 'Asistente no encontrado' };
  const title = `Asistente 24 horas · Ayuntamiento de ${pueblo.nombre}`;
  const description = `Pregunte lo que quiera sobre ${pueblo.nombre}: horarios, trámites, servicios, fiestas o incidencias. Responde al momento, a cualquier hora.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'website', locale: 'es_ES' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function PuebloPage({ params }: Props) {
  const pueblo = await getPueblo(params.slug);
  if (!pueblo) notFound();

  if (isRealVisitor(headers().get('user-agent'))) {
    await notify(`Demo de ${pueblo.nombre}`, `Alguien ha abierto la demo de ${pueblo.nombre}.`);
  }

  const fecha = new Date(pueblo.generadoEl).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <DemoApp
      slug={pueblo.slug}
      nombre={pueblo.nombre}
      escudoUrl={pueblo.escudoUrl}
      web={pueblo.web}
      fecha={fecha}
      sugerencias={pueblo.sugerencias}
      contact={{
        email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
        whatsapp: contactWhatsapp(),
        whatsappDemo: process.env.NEXT_PUBLIC_WHATSAPP_DEMO_NUMBER,
      }}
    />
  );
}
