import { ArrowRight } from '@phosphor-icons/react/dist/ssr';

/** Botón «Pedir mi demo» de las landings. Los enlaces externos abren en otra pestaña. */
export function Cta({ href, className = '' }: { href: string; className?: string }) {
  const external = href.startsWith('http') || href.startsWith('mailto:');
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`press inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 font-semibold ${className}`}
    >
      Pedir mi demo
      <ArrowRight size={18} weight="bold" aria-hidden />
    </a>
  );
}
