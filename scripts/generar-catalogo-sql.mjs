// Genera supabase/catalogo.sql a partir de data/catalogo.json (los 237 productos de la app).
// Uso: node scripts/generar-catalogo-sql.mjs
import { readFile, writeFile } from 'node:fs/promises';
const { productos } = JSON.parse(await readFile(new URL('../data/catalogo.json', import.meta.url)));
const q = v => v === null || v === undefined ? 'null' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
const filas = productos.map(p => `  (${[p.id, p.nombre, p.seccion, p.unidad, p.envase, p.formato, p.precio_demo, p.fresco, p.en_recetas].map(q).join(', ')})`);
const sql = `-- Catálogo de Mi Compra Inteligente: ${productos.length} productos (generado desde la app).
-- Pégalo en Supabase → SQL Editor DESPUÉS de esquema.sql. Se puede repetir sin duplicar.
insert into public.productos (id, nombre, seccion, unidad, envase, formato, precio_demo, fresco, en_recetas) values
${filas.join(',\n')}
on conflict (id) do update set nombre = excluded.nombre, seccion = excluded.seccion, unidad = excluded.unidad,
  envase = excluded.envase, formato = excluded.formato, precio_demo = excluded.precio_demo,
  fresco = excluded.fresco, en_recetas = excluded.en_recetas, actualizado_en = now();
`;
await writeFile(new URL('../supabase/catalogo.sql', import.meta.url), sql);
console.log(`supabase/catalogo.sql: ${productos.length} productos`);
