import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-xl flex-col justify-center px-5">
      <h1 className="text-3xl font-semibold tracking-[-0.03em]">Esta página no existe</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        Puede que el enlace de la demostración tenga un error. Revise que el nombre del municipio esté bien
        escrito o pruebe el ejemplo.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <Link
          href="/villaejemplo"
          className="press rounded-full bg-cobalt px-5 py-3 font-semibold text-cobalt-on [@media(hover:hover)]:hover:bg-cobalt-strong"
        >
          Abrir el ejemplo
        </Link>
        <Link href="/" className="font-medium text-cobalt-text underline underline-offset-4">
          Ir a la portada
        </Link>
      </div>
    </main>
  );
}
