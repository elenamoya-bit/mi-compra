// Mide cuántos productos de Mi Compra Inteligente tienen precio de Mercadona en Open Prices
// y de cuándo son. Solo LEE datos públicos. Respeta la API: 1 petición por segundo como máximo,
// identificándonos con un User-Agent. Datos de Open Prices bajo licencia ODbL.
//
// Uso: node scripts/cobertura-open-prices.mjs   (escribe informes/cobertura-open-prices.{json,md})
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const API = 'https://prices.openfoodfacts.org/api/v1';
const UA = 'MiCompraInteligente/0.1 (+https://github.com/elenamoya-bit/mi-compra)';
const PAUSA_MS = 1100;           // nunca más de una petición por segundo
const MAX_PAGINAS_PRECIOS = 400; // tope de seguridad (40.000 precios)
const espera = ms => new Promise(r => setTimeout(r, ms));
let peticiones = 0;

async function get(path) {
  for (let intento = 1; intento <= 3; intento++) {
    await espera(PAUSA_MS); peticiones++;
    const r = await fetch(API + path, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (r.status === 429 || r.status >= 500) { await espera(5000 * intento); continue; }
    if (!r.ok) throw new Error(`${r.status} en ${path}`);
    return r.json();
  }
  throw new Error(`Sin respuesta tras 3 intentos: ${path}`);
}
async function todas(path, tope = 1000) {
  const out = []; let page = 1, pages = 1;
  do { const j = await get(`${path}${path.includes('?') ? '&' : '?'}size=100&page=${page}`); out.push(...(j.items || [])); pages = j.pages || 1; page++; }
  while (page <= pages && page <= tope);
  return { items: out, truncado: page <= pages };
}

const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
const VACIAS = new Set(['de','del','la','el','los','las','en','con','y','a','al','para','sin','pack','bandeja','bolsa','fresco','fresca','frescos','frescas','natural','extra','hacendado','mercadona','tipo','l','g','kg','ml','ud','unidades']);
const raiz = w => w.length > 4 ? w.replace(/(es|s)$/, '') : w;
const tokens = t => norm(t).split(' ').filter(w => w && !VACIAS.has(w) && !/^\d/.test(w)).map(raiz);

function encaja(nuestro, suyo) {
  const a = tokens(nuestro), b = new Set(tokens(suyo)); if (!a.length || !b.size) return 0;
  if (!b.has(a[0])) return 0;                 // la palabra principal tiene que estar
  return a.filter(w => b.has(w)).length / a.length;
}

const diasDesde = d => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
const tramo = d => d <= 7 ? '≤ 7 días' : d <= 30 ? '8-30 días' : d <= 90 ? '1-3 meses' : d <= 365 ? '3-12 meses' : '> 1 año';
const TRAMOS = ['≤ 7 días', '8-30 días', '1-3 meses', '3-12 meses', '> 1 año'];

const catalogo = JSON.parse(await readFile(new URL('../data/catalogo.json', import.meta.url))).productos;

// 1) Tiendas Mercadona registradas en Open Prices
const { items: locs } = await todas('/locations?osm_name__like=mercadona');
const esMercadona = l => /mercadona/i.test(`${l.osm_name || ''} ${l.osm_brand || ''}`);
const pais = l => norm(l.osm_address_country);
const tiendas = locs.filter(esMercadona);
const tiendasES = tiendas.filter(l => /espana|spain|espanya|espainia/.test(pais(l)));
const conPrecios = tiendasES.filter(l => (l.price_count || 0) > 0);

// 2) Precios de esas tiendas
const precios = []; let truncadas = 0, paginas = 0;
for (const l of conPrecios) {
  const restante = MAX_PAGINAS_PRECIOS - paginas; if (restante <= 0) { truncadas++; continue; }
  const r = await todas(`/prices?location_id=${l.id}&order_by=-date`, Math.min(restante, 50));
  paginas += Math.ceil((r.items.length || 1) / 100); if (r.truncado) truncadas++;
  for (const p of r.items) precios.push({
    id: p.id, ean: p.product_code || null,
    nombre: p.product?.product_name || p.product_name || '', marca: p.product?.brands || '',
    cantidad: p.product?.product_quantity ? `${p.product.product_quantity} ${p.product.product_quantity_unit || ''}`.trim() : '',
    categoria: p.category_tag || null, precio: Number(p.price), precio_por: p.price_per || null, moneda: p.currency,
    oferta: !!p.price_is_discounted, fecha: p.date, tienda_id: l.id,
    ciudad: l.osm_address_city || '', cp: l.osm_address_postcode || '', prueba: p.proof?.type || null,
  });
}

// 3) Resumen general
const eans = new Set(precios.filter(p => p.ean).map(p => p.ean));
const porTramo = Object.fromEntries(TRAMOS.map(t => [t, 0]));
for (const p of precios) if (p.fecha) porTramo[tramo(diasDesde(p.fecha))]++;

// 4) Cruce con nuestros 237 productos (por nombre; los EAN no los tenemos todavía)
const cruce = catalogo.map(c => {
  const cands = precios.map(p => ({ p, s: encaja(c.nombre, `${p.nombre} ${p.categoria || ''}`) })).filter(x => x.s >= 0.67)
    .sort((a, b) => b.s - a.s || (b.p.fecha || '').localeCompare(a.p.fecha || ''));
  const masReciente = cands.reduce((m, x) => (!m || (x.p.fecha || '') > (m.p.fecha || '') ? x : m), null);
  return { id: c.id, nombre: c.nombre, seccion: c.seccion, en_recetas: c.en_recetas, precios_encontrados: cands.length,
    mas_reciente: masReciente ? { fecha: masReciente.p.fecha, dias: diasDesde(masReciente.p.fecha), precio: masReciente.p.precio, nombre_open_prices: masReciente.p.nombre, cantidad: masReciente.p.cantidad, ean: masReciente.p.ean, ciudad: masReciente.p.ciudad } : null };
});
const encontrados = cruce.filter(x => x.mas_reciente);
const recientes = d => encontrados.filter(x => x.mas_reciente.dias <= d).length;

const informe = {
  generado: new Date().toISOString(), fuente: 'Open Prices (Open Food Facts) · ODbL', peticiones,
  tiendas_mercadona: { total: tiendas.length, espana: tiendasES.length, con_precios: conPrecios.length },
  precios: { total: precios.length, productos_distintos_ean: eans.size, por_antiguedad: porTramo, tiendas_truncadas: truncadas },
  nuestro_catalogo: { total: catalogo.length, con_algun_precio: encontrados.length, con_precio_7_dias: recientes(7), con_precio_30_dias: recientes(30), con_precio_90_dias: recientes(90),
    de_recetas: catalogo.filter(c => c.en_recetas).length, de_recetas_con_precio: encontrados.filter(x => x.en_recetas).length },
  ciudades: [...new Set(conPrecios.map(l => l.osm_address_city).filter(Boolean))].sort(),
  cruce,
};
await mkdir(new URL('../informes/', import.meta.url), { recursive: true });
await writeFile(new URL('../informes/cobertura-open-prices.json', import.meta.url), JSON.stringify(informe, null, 1));

const pct = (a, b) => b ? `${Math.round(a / b * 100)} %` : '0 %';
const md = `# Cobertura de Open Prices para Mercadona

Generado: ${informe.generado} · ${peticiones} peticiones (máx. 1 por segundo) · Datos: Open Prices (Open Food Facts), licencia ODbL.

## Tiendas
- Tiendas Mercadona en Open Prices: **${tiendas.length}** (en España: **${tiendasES.length}**, con algún precio: **${conPrecios.length}**)
- Ciudades con precios: ${informe.ciudades.join(', ') || '—'}

## Precios encontrados
- Precios: **${precios.length}** · productos distintos (EAN): **${eans.size}**${truncadas ? ` · ⚠️ ${truncadas} tiendas con más precios de los descargados (tope de seguridad)` : ''}
${TRAMOS.map(t => `- ${t}: ${porTramo[t]} (${pct(porTramo[t], precios.length)})`).join('\n')}

## Nuestros ${catalogo.length} productos
- Con algún precio de Mercadona: **${encontrados.length}** (${pct(encontrados.length, catalogo.length)})
- Con precio de los últimos 7 días: **${informe.nuestro_catalogo.con_precio_7_dias}** · 30 días: **${informe.nuestro_catalogo.con_precio_30_dias}** · 90 días: **${informe.nuestro_catalogo.con_precio_90_dias}**
- De los ${informe.nuestro_catalogo.de_recetas} que usan las recetas: **${informe.nuestro_catalogo.de_recetas_con_precio}** con algún precio

El cruce es por nombre (aún no tenemos los EAN), así que cada coincidencia hay que revisarla antes de usarla.

| Producto | Último precio | Antigüedad | Nombre en Open Prices |
|---|---|---|---|
${encontrados.sort((a, b) => a.mas_reciente.dias - b.mas_reciente.dias).map(x => `| ${x.nombre} | ${x.mas_reciente.precio} € | ${x.mas_reciente.dias} días | ${x.mas_reciente.nombre_open_prices} ${x.mas_reciente.cantidad} |`).join('\n')}
`;
await writeFile(new URL('../informes/cobertura-open-prices.md', import.meta.url), md);
console.log(md.split('\n').slice(0, 24).join('\n'));
