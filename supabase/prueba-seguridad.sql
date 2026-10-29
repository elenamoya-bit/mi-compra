-- Comprueba las reglas de seguridad. En Supabase: pégalo en el SQL Editor y ejecútalo.
-- Cada línea debe decir OK. Si alguna dice FALLO, no conectes la app y avísame.
do $$
declare n int; ok boolean;
begin
  -- 1) Como la app (clave pública): puede leer productos y precios
  set local role anon;
  select count(*) into n from public.productos;           raise notice 'OK  anon lee productos (%).', n;
  select count(*) into n from public.precios_actuales;    raise notice 'OK  anon lee precios_actuales (%).', n;

  -- 2) …pero no puede escribir
  begin insert into public.precios (producto_id, supermercado_id, fuente_id, precio, observado_en) values ('aguacate','mercadona','tickets',1,current_date);
        raise notice 'FALLO anon ha podido insertar un precio';
  exception when insufficient_privilege then raise notice 'OK  anon NO puede insertar precios'; end;
  begin update public.productos set precio_demo = 0.01;
        raise notice 'FALLO anon ha podido modificar productos';
  exception when insufficient_privilege then raise notice 'OK  anon NO puede modificar productos'; end;
  begin delete from public.precios;
        raise notice 'FALLO anon ha podido borrar precios';
  exception when insufficient_privilege then raise notice 'OK  anon NO puede borrar precios'; end;

  -- 3) …ni ver las tablas internas
  begin select count(*) into n from public.equivalencias; raise notice 'FALLO anon ve equivalencias';
  exception when insufficient_privilege then raise notice 'OK  anon NO ve equivalencias'; end;
  begin select count(*) into n from public.registro_actualizaciones; raise notice 'FALLO anon ve el registro';
  exception when insufficient_privilege then raise notice 'OK  anon NO ve el registro de actualizaciones'; end;

  reset role;
  -- 4) La base de datos rechaza datos absurdos aunque escriba la tarea automática
  begin insert into public.precios (producto_id, supermercado_id, fuente_id, precio, observado_en) values ('aguacate','mercadona','tickets',-3,current_date);
        raise notice 'FALLO se ha aceptado un precio negativo';
  exception when check_violation then raise notice 'OK  se rechaza un precio negativo'; end;
  begin insert into public.precios (producto_id, supermercado_id, fuente_id, precio, observado_en) values ('aguacate','mercadona','tickets',2,current_date + 30);
        raise notice 'FALLO se ha aceptado un precio del futuro';
  exception when check_violation then raise notice 'OK  se rechaza un precio con fecha futura'; end;
  begin insert into public.precios (producto_id, supermercado_id, fuente_id, precio, observado_en, moneda) values ('aguacate','mercadona','tickets',2,current_date,'USD');
        raise notice 'FALLO se ha aceptado otra moneda';
  exception when check_violation then raise notice 'OK  solo se aceptan euros'; end;
  -- RLS activado en todas las tablas
  select bool_and(c.relrowsecurity) into ok from pg_class c join pg_namespace s on s.oid=c.relnamespace
   where s.nspname='public' and c.relname in ('supermercados','fuentes','productos','equivalencias','precios','registro_actualizaciones');
  raise notice '%  RLS activado en las 6 tablas', case when ok then 'OK ' else 'FALLO' end;
end $$;
