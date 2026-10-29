-- =====================================================================
--  Mi Compra Inteligente · esquema de precios para Supabase
--  Pégalo entero en Supabase → SQL Editor → New query → Run.
--  Se puede ejecutar varias veces: no borra datos.
--
--  Seguridad (RLS):
--   · La clave pública (anon) SOLO puede LEER supermercados, fuentes, productos
--     y la vista precios_actuales. No puede escribir nada.
--   · equivalencias y registro_actualizaciones no se pueden ni leer con la clave pública.
--   · Solo la clave privada (service_role), guardada en los Secrets de GitHub,
--     puede escribir. Nunca debe aparecer en el código ni en la web.
-- =====================================================================

-- ---------- Tablas ----------
create table if not exists public.supermercados (
  id      text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  nombre  text not null
);

create table if not exists public.fuentes (
  id              text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  nombre          text not null,
  tipo            text not null check (tipo in ('real','demostracion')),
  licencia        text,
  url             text,
  -- cada cuánto se permite consultarla y a partir de cuántos días un precio se considera antiguo
  intervalo_min   interval not null default interval '1 day',
  caduca_en_dias  int not null default 7 check (caduca_en_dias between 1 and 365),
  activa          boolean not null default false
);

create table if not exists public.productos (
  id            text primary key check (id ~ '^[a-z0-9_-]{2,40}$'),   -- el mismo id que usa la app
  nombre        text not null,
  seccion       text not null,
  unidad        text not null check (unidad in ('g','ml','ud')),
  envase        numeric(10,3) not null check (envase > 0),
  formato       text not null,
  precio_demo   numeric(8,2) not null check (precio_demo > 0 and precio_demo < 1000),
  fresco        boolean not null default false,
  en_recetas    boolean not null default false,
  actualizado_en timestamptz not null default now()
);

-- Qué producto de la fuente corresponde a cada producto de la app (privada).
-- Solo se usan las verificadas: así nunca se cuela un precio de un producto distinto.
create table if not exists public.equivalencias (
  producto_id     text not null references public.productos(id) on delete cascade,
  fuente_id       text not null references public.fuentes(id),
  ref_externa     text not null,                 -- EAN u otro identificador de la fuente
  nombre_externo  text,
  cantidad_externa numeric(10,3) check (cantidad_externa is null or cantidad_externa > 0),
  unidad_externa  text check (unidad_externa is null or unidad_externa in ('g','ml','ud')),
  verificada      boolean not null default false,
  notas           text,
  creada_en       timestamptz not null default now(),
  primary key (producto_id, fuente_id, ref_externa)
);

create table if not exists public.precios (
  id               bigint generated always as identity primary key,
  producto_id      text not null references public.productos(id) on delete cascade,
  supermercado_id  text not null references public.supermercados(id),
  fuente_id        text not null references public.fuentes(id),
  codigo_postal    text check (codigo_postal is null or codigo_postal ~ '^[0-9]{5}$'),
  precio           numeric(8,2) not null check (precio > 0 and precio < 1000),
  moneda           text not null default 'EUR' check (moneda = 'EUR'),
  formato          text,
  envase           numeric(10,3) check (envase is null or envase > 0),   -- en la unidad del producto
  precio_unidad    numeric(10,4) check (precio_unidad is null or precio_unidad > 0),
  oferta           boolean not null default false,
  ref_externa      text,
  observado_en     date not null check (observado_en > date '2015-01-01'),  -- cuándo se vio ese precio en tienda
  obtenido_en      timestamptz not null default now(),                       -- cuándo lo guardamos nosotros
  constraint precio_no_futuro check (observado_en <= (obtenido_en at time zone 'Europe/Madrid')::date + 1),
  constraint precio_unico unique nulls not distinct (producto_id, fuente_id, ref_externa, codigo_postal, observado_en)
);
create index if not exists precios_ultimo_idx on public.precios (producto_id, supermercado_id, observado_en desc, obtenido_en desc);

create table if not exists public.registro_actualizaciones (
  id          bigint generated always as identity primary key,
  fuente_id   text not null references public.fuentes(id),
  inicio      timestamptz not null default now(),
  fin         timestamptz,
  estado      text not null default 'en_curso' check (estado in ('en_curso','ok','error','omitida')),
  leidos      int not null default 0,
  guardados   int not null default 0,
  descartados int not null default 0,
  mensaje     text
);

-- ---------- Vista que lee la app ----------
-- El último precio de cada producto por supermercado y código postal, con su antigüedad
-- y su estado ('actual' o 'antiguo') calculado en la base de datos, para que nadie
-- pueda presentar un precio viejo como actual.
create or replace view public.precios_actuales
with (security_invoker = true) as
select distinct on (p.producto_id, p.supermercado_id, p.codigo_postal)
  p.producto_id, p.supermercado_id, p.codigo_postal, p.precio, p.formato, p.envase, p.precio_unidad,
  p.oferta, p.observado_en, p.obtenido_en, p.fuente_id, f.nombre as fuente, f.licencia,
  (current_date - p.observado_en) as dias,
  case when (current_date - p.observado_en) <= f.caduca_en_dias then 'actual' else 'antiguo' end as estado
from public.precios p
join public.fuentes f on f.id = p.fuente_id and f.tipo = 'real'
order by p.producto_id, p.supermercado_id, p.codigo_postal, p.observado_en desc, p.obtenido_en desc;

-- ---------- Seguridad: RLS y permisos ----------
alter table public.supermercados            enable row level security;
alter table public.fuentes                  enable row level security;
alter table public.productos                enable row level security;
alter table public.equivalencias            enable row level security;
alter table public.precios                  enable row level security;
alter table public.registro_actualizaciones enable row level security;

-- Defensa doble: además de RLS, quitamos todos los permisos a los roles públicos…
revoke all on public.supermercados, public.fuentes, public.productos, public.equivalencias,
              public.precios, public.registro_actualizaciones, public.precios_actuales
  from anon, authenticated;
-- …y damos solo lectura de lo que la app necesita.
grant select on public.supermercados, public.fuentes, public.productos, public.precios, public.precios_actuales
  to anon, authenticated;

drop policy if exists "lectura publica" on public.supermercados;
drop policy if exists "lectura publica" on public.fuentes;
drop policy if exists "lectura publica" on public.productos;
drop policy if exists "lectura publica" on public.precios;
create policy "lectura publica" on public.supermercados for select to anon, authenticated using (true);
create policy "lectura publica" on public.fuentes       for select to anon, authenticated using (true);
create policy "lectura publica" on public.productos     for select to anon, authenticated using (true);
create policy "lectura publica" on public.precios       for select to anon, authenticated using (true);
-- equivalencias y registro_actualizaciones: sin políticas → con la clave pública no se ven.
-- Ninguna política de INSERT/UPDATE/DELETE → con la clave pública no se puede escribir nada.
-- La tarea automática usa service_role, que en Supabase salta RLS y solo vive en los Secrets de GitHub.

-- ---------- Datos fijos ----------
insert into public.supermercados (id, nombre) values ('mercadona','Mercadona')
  on conflict (id) do update set nombre = excluded.nombre;
insert into public.fuentes (id, nombre, tipo, licencia, url, intervalo_min, caduca_en_dias, activa) values
  ('open_prices', 'Open Prices (Open Food Facts)', 'real', 'ODbL 1.0', 'https://prices.openfoodfacts.org', interval '1 day', 30, true),
  ('tickets',     'Tickets introducidos a mano', 'real', 'Propios', null, interval '1 hour', 30, true),
  ('proveedor',   'Proveedor autorizado (pendiente)', 'real', 'Por contrato', null, interval '30 minutes', 2, false)
on conflict (id) do update set nombre = excluded.nombre, tipo = excluded.tipo, licencia = excluded.licencia, url = excluded.url;
