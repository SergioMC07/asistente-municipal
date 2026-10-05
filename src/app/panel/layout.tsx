import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel · Atiende',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
