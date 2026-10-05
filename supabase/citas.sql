-- ============================================
-- Citas de Atiende. Ejecutar una vez en Supabase → SQL Editor.
-- ============================================
-- Solo el servidor accede (con la service key), por eso RLS está activado
-- y sin políticas: nadie más puede leer ni escribir.

create table if not exists citas (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  tipo text not null,
  inicio timestamptz not null,
  fin timestamptz not null,
  plaza smallint not null default 1,
  nombre text not null,
  telefono text not null,
  nota text,
  origen text not null default 'asistente' check (origen in ('asistente', 'manual')),
  estado text not null default 'confirmada' check (estado in ('confirmada', 'cancelada')),
  creada timestamptz not null default now()
);

-- Dos personas no pueden quedarse la misma plaza del mismo hueco.
create unique index if not exists citas_hueco_unico
  on citas (slug, inicio, plaza) where estado = 'confirmada';

create index if not exists citas_por_negocio on citas (slug, inicio);

create table if not exists bloqueos (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  inicio timestamptz not null,
  fin timestamptz not null,
  motivo text,
  creado timestamptz not null default now(),
  check (fin > inicio)
);

create index if not exists bloqueos_por_negocio on bloqueos (slug, inicio);

alter table citas enable row level security;
alter table bloqueos enable row level security;

-- Borrado automático, como dice la política de privacidad: cada noche se
-- eliminan las citas y los bloqueos que terminaron hace más de 30 días.
create extension if not exists pg_cron;
select cron.schedule(
  'borrar-citas-antiguas',
  '0 4 * * *',
  $$delete from citas where fin < now() - interval '30 days';
    delete from bloqueos where fin < now() - interval '30 days';$$
);
