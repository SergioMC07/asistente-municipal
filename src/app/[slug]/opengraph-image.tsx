// Imagen de vista previa al compartir el enlace de la demo (WhatsApp, email…).

import { ImageResponse } from 'next/og';
import { getPueblo } from '@/lib/pueblo';

export const runtime = 'nodejs';
export const alt = 'Asistente 24 horas del ayuntamiento';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const pueblo = await getPueblo(params.slug);
  const nombre = pueblo?.nombre ?? 'tu municipio';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #174784 0%, #1E5AA8 60%, #2C6FC4 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, opacity: 0.85 }}>Asistente 24 horas</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 40, opacity: 0.9 }}>Ayuntamiento de</div>
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>{nombre}</div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Horarios y trámites', 'Fiestas y servicios', 'Incidencias'].map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                padding: '12px 24px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.16)',
                fontSize: 28,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
