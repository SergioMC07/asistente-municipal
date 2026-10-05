import { redirect } from 'next/navigation';
import { Entrar } from '@/components/panel/Entrar';
import { sesionActual } from '@/lib/panel/sesion';

export const dynamic = 'force-dynamic';

export default async function EntrarPage({ searchParams }: { searchParams: { caducado?: string } }) {
  if (await sesionActual()) redirect('/panel');
  return (
    <main className="flex min-h-[100dvh] items-center bg-[var(--fondo)] px-4 py-14">
      <div className="mx-auto w-full max-w-sm">
        <p className="font-semibold tracking-[-0.02em] text-cobalt-text">Atentia</p>
        <h1 className="mt-6 text-[1.75rem] font-semibold leading-tight tracking-[-0.035em]">Entra en tu panel</h1>
        <p className="mt-2 leading-relaxed text-muted">
          Las conversaciones, citas y solicitudes de tu asistente. Te enviamos un enlace al email, sin contraseñas.
        </p>
        <Entrar caducado={searchParams.caducado === '1'} />
      </div>
    </main>
  );
}
