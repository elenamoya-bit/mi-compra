-- =====================================================================
--  Mi Compra Inteligente · COMPRA FAMILIAR COMPARTIDA
--  Pégalo entero en Supabase → SQL Editor → New query → Run.
--  Se puede ejecutar varias veces sin perder datos.
--
--  Cómo funciona la seguridad (sin contraseñas):
--   · Cada familia tiene un código de 12 letras al azar (≈ 10^18 combinaciones),
--     que viaja en el enlace de invitación. Quien tiene el código entra.
--   · La tabla NO se puede leer ni escribir directamente con la clave pública:
--     no hay forma de listar familias ni de ver las de otros.
--   · Solo se accede a través de 4 funciones, y todas piden el código exacto.
-- =====================================================================

create table if not exists public.hogares (
  codigo       text primary key check (codigo ~ '^[A-HJ-NP-Z2-9]{12}$'),
  estado       jsonb not null check (pg_column_size(estado) < 200000),   -- menú, lista, despensa… (< 200 KB)
  version      bigint not null default 1,
  creado_en    timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.hogares enable row level security;
-- Sin políticas: con la clave pública no se puede tocar la tabla directamente.
revoke all on public.hogares from anon, authenticated, public;

-- Código al azar de 12 caracteres sin letras confusas (sin I, O, 0, 1)
create or replace function public._codigo_nuevo() returns text
language sql volatile set search_path = public as $$
  with b as (select decode(replace(gen_random_uuid()::text,'-',''),'hex') || decode(replace(gen_random_uuid()::text,'-',''),'hex') as bytes)
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (get_byte(bytes, i) % 32) + 1, 1), '' order by i)
  from b, unnest(array[0,1,2,3,4,5,9,10,11,12,13,14]) as i;   -- se saltan los bytes fijos del UUID
$$;

-- Crear una compra familiar con el estado actual del móvil que invita
create or replace function public.crear_hogar(p_estado jsonb)
returns table(codigo text, version bigint)
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if p_estado is null or jsonb_typeof(p_estado) <> 'object' then raise exception 'estado no válido'; end if;
  loop
    c := public._codigo_nuevo();
    begin
      insert into public.hogares(codigo, estado) values (c, p_estado);
      exit;
    exception when unique_violation then -- casi imposible: se prueba otro código
    end;
  end loop;
  return query select c, 1::bigint;
end $$;

-- Leer el estado de una familia (solo con su código)
create or replace function public.leer_hogar(p_codigo text)
returns table(estado jsonb, version bigint)
language sql stable security definer set search_path = public as $$
  select h.estado, h.version from public.hogares h where h.codigo = upper(p_codigo);
$$;

-- Saber si ha cambiado algo (consulta ligera que la app hace cada pocos segundos)
create or replace function public.version_hogar(p_codigo text)
returns bigint
language sql stable security definer set search_path = public as $$
  select h.version from public.hogares h where h.codigo = upper(p_codigo);
$$;

-- Guardar cambios. Si otro miembro guardó antes (versión distinta), no pisa nada:
-- devuelve ok = false con lo último, y la app junta los cambios de los dos y vuelve a intentarlo.
create or replace function public.guardar_hogar(p_codigo text, p_estado jsonb, p_version bigint)
returns table(ok boolean, version bigint, estado jsonb)
language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if p_estado is null or jsonb_typeof(p_estado) <> 'object' then raise exception 'estado no válido'; end if;
  update public.hogares h set estado = p_estado, version = h.version + 1, actualizado_en = now()
   where h.codigo = upper(p_codigo) and h.version = p_version
   returning h.version into v;
  if found then return query select true, v, null::jsonb; return; end if;
  return query select false, h.version, h.estado from public.hogares h where h.codigo = upper(p_codigo);
end $$;

revoke all on function public._codigo_nuevo() from public, anon, authenticated;
revoke all on function public.crear_hogar(jsonb), public.leer_hogar(text), public.version_hogar(text),
                       public.guardar_hogar(text, jsonb, bigint) from public;
grant execute on function public.crear_hogar(jsonb), public.leer_hogar(text), public.version_hogar(text),
                          public.guardar_hogar(text, jsonb, bigint) to anon, authenticated;
