// Imagen de vista previa al compartir el enlace de la demo (WhatsApp, email…).

import { ImageResponse } from 'next/og';

export const alt = 'Atentia, asistente 24 horas para autoescuelas y academias';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {

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
          background: '#1D4AA5',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 32, fontWeight: 600 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#F7F8FB',
              color: '#1D4AA5',
            }}
          >
            A
          </div>
          Atentia
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>Tu autoescuela o academia,</div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>contestando a cualquier hora.</div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Asistente 24 horas', 'WhatsApp y web', 'Solicitudes'].map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                padding: '12px 24px',
                borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.35)',
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
