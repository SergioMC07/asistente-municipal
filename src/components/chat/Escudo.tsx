export function Escudo({
  nombre,
  url,
  size = 'md',
}: {
  nombre: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const box = {
    sm: 'h-7 w-7 text-[11px] rounded-[8px]',
    md: 'h-10 w-10 text-sm rounded-[10px]',
    lg: 'h-14 w-14 text-lg rounded-[14px]',
  }[size];
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
  // Sin escudo ni logo: monograma en el color de la demo (cobalto o el de la marca).
  return (
    <div
      aria-hidden
      className={`${box} flex shrink-0 items-center justify-center bg-cobalt font-semibold text-cobalt-on ring-1 ring-inset ring-white/20`}
    >
      {iniciales}
    </div>
  );
}
