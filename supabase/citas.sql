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

-- ============================================
-- Panel del negocio: conversaciones, mensajes y registros
-- ============================================
-- Solo de clientes reales. Clave (slug, id): cada negocio ve solo lo suyo.

create table if not exists conversaciones (
  slug text not null,
  id uuid not null,
  canal text not null default 'web' check (canal in ('web', 'whatsapp')),
  cliente text,
  nombre text,
  primera text,
  ultima text,
  tiene_cita boolean not null default false,
  tiene_registro boolean not null default false,
  sin_respuesta boolean not null default false,
  pregunta_sin_respuesta text,
  creada timestamptz not null default now(),
  actualizada timestamptz not null default now(),
  primary key (slug, id)
);
create index if not exists conversaciones_recientes on conversaciones (slug, actualizada desc);

create table if not exists mensajes (
  id bigint generated always as identity primary key,
  slug text not null,
  conversacion_id uuid not null,
  rol text not null check (rol in ('user', 'assistant', 'humano')),
  contenido text not null,
  creado timestamptz not null default now(),
  foreign key (slug, conversacion_id) references conversaciones (slug, id) on delete cascade
);
create index if not exists mensajes_por_conversacion on mensajes (slug, conversacion_id, creado);

-- Solicitudes («que me llamen») e incidencias, con su estado.
create table if not exists registros (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  conversacion_id uuid,
  clase text not null check (clase in ('incidencia', 'solicitud')),
  tipo text not null,
  lugar text not null default '',
  detalle text not null default '',
  nombre text,
  telefono text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'hecho')),
  creado timestamptz not null default now()
);
create index if not exists registros_por_negocio on registros (slug, creado desc);

alter table conversaciones enable row level security;
alter table mensajes enable row level security;
alter table registros enable row level security;

-- Borrado automático a los 30 días (los mensajes se borran con su conversación).
select cron.schedule(
  'borrar-conversaciones-antiguas',
  '15 4 * * *',
  $$delete from conversaciones where actualizada < now() - interval '30 days';
    delete from registros where creado < now() - interval '30 days';$$
);
