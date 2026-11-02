-- Comprueba la compra familiar. En Supabase: pégalo en el SQL Editor y ejecútalo después de familia.sql.
-- Cada línea debe decir OK. Si alguna dice FALLO, avísame antes de conectar la app.
do $$
declare c text; v bigint; r record; n int; ok boolean;
begin
  set local role anon;
  -- 1) Se puede crear una familia y leerla con su código
  select * into r from public.crear_hogar('{"menu":[],"marcados":{"huevos":true}}'::jsonb); c := r.codigo;
  raise notice '%  crear familia (código %)', case when c ~ '^[A-HJ-NP-Z2-9]{12}$' then 'OK ' else 'FALLO' end, c;
  select * into r from public.leer_hogar(c);
  raise notice '%  leer con el código', case when r.estado->'marcados'->>'huevos' = 'true' then 'OK ' else 'FALLO' end;
  select * into r from public.leer_hogar(lower(c));
  raise notice '%  el código funciona en minúsculas', case when r.version = 1 then 'OK ' else 'FALLO' end;
  -- 2) Guardar con la versión correcta sube la versión
  select * into r from public.guardar_hogar(c, '{"marcados":{"huevos":true,"pan":true}}'::jsonb, 1);
  raise notice '%  guardar cambios (versión %)', case when r.ok and r.version = 2 then 'OK ' else 'FALLO' end, r.version;
  -- 3) Guardar con una versión vieja NO pisa lo del otro y devuelve lo último
  select * into r from public.guardar_hogar(c, '{"marcados":{}}'::jsonb, 1);
  raise notice '%  no se pisan los cambios de otro miembro', case when not r.ok and r.version = 2 and r.estado->'marcados'->>'pan' = 'true' then 'OK ' else 'FALLO' end;
  -- 4) Un código inventado no da nada
  select count(*) into n from public.leer_hogar('ABCDEFGHJKLM');
  raise notice '%  un código inventado no ve nada', case when n = 0 then 'OK ' else 'FALLO' end;
  -- 5) No se puede leer ni escribir la tabla directamente
  begin select count(*) into n from public.hogares; raise notice 'FALLO se pueden listar las familias';
  exception when insufficient_privilege then raise notice 'OK   no se pueden listar las familias'; end;
  begin delete from public.hogares; raise notice 'FALLO se pueden borrar familias';
  exception when insufficient_privilege then raise notice 'OK   no se pueden borrar familias'; end;
  begin perform public._codigo_nuevo(); raise notice 'FALLO se puede llamar a la función interna';
  exception when insufficient_privilege then raise notice 'OK   la función interna está protegida'; end;
  reset role;
  delete from public.hogares where codigo = c;   -- limpia la familia de prueba
end $$;
