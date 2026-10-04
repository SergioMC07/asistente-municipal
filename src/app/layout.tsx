import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Asistente municipal 24 horas',
  description: 'Asistente con IA para atender a los vecinos de tu ayuntamiento a cualquier hora.',
  // Las demos son privadas: se comparten por enlace, no deben salir en buscadores.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
