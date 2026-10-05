import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel · Atentia',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
