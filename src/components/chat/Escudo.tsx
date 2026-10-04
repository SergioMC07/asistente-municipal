export function Escudo({
  nombre,
  url,
  size = 'md',
}: {
  nombre: string;
  url?: string;
  size?: 'sm' | 'md';
}) {
  const box = size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-10 w-10 text-sm';
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={`${box} shrink-0 object-contain`} />;
  }
  const iniciales =
    nombre
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || nombre[0]?.toUpperCase();
  // Sin escudo: monograma en azulejo cobalto.
  return (
    <div
      aria-hidden
      className={`${box} flex shrink-0 items-center justify-center rounded-[10px] bg-cobalt font-semibold text-cobalt-on ring-1 ring-inset ring-white/20`}
    >
      {iniciales}
    </div>
  );
}
