import Link from 'next/link';

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh]">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-cobalt text-[15px] text-cobalt-on ring-1 ring-inset ring-white/20"
          >
            A
          </span>
          Atentia
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-8">
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{title}</h1>
        <div className="mt-8 max-w-[68ch] space-y-5 leading-relaxed text-muted [&_a]:text-cobalt-text [&_a]:underline [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  );
}
