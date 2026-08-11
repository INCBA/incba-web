/**
 * Verificación del sitio generado, contra un servidor levantado con
 * tools/serve.mjs (que resuelve las URLs igual que GitHub Pages).
 *
 *   node tools/serve.mjs dist-ar --port=8099 &
 *   node tools/verify.mjs --port=8099
 *
 * Comprueba lo que pide el brief: que las rutas respondan, que el contenido
 * esté en el HTML servido y no inyectado por JavaScript, que ningún meta tag
 * se repita entre páginas y que no haya enlaces rotos.
 */

import { PAGES } from '../src/site.config.mjs'

const port = Number((process.argv.find((a) => a.startsWith('--port=')) || '--port=8099').split('=')[1])
const BASE = `http://localhost:${port}`

const fallas = []
const falla = (msg) => fallas.push(msg)

const rutaDe = (slug) => (slug ? `/${slug}` : '/')
const tag = (html, re) => (html.match(re) || [])[1]

/** Marcador de contenido por página: una frase que tiene que estar en el HTML
 *  servido. Si no aparece, el contenido se está inyectando por JS y el crawler
 *  no lo ve. */
const MARCADORES = {
  '': 'Conectamos sistemas.',
  servicios: 'Integración de plataformas',
  proceso: 'Metodología estructurada',
  'casos-de-exito': 'Reducción de errores operativos',
  'por-que-incba': 'Estrategia antes que ejecución',
  equipo: 'Rebolledo',
  partners: 'Programa de Partners',
  clientes: 'Empresas que confían en nosotros',
  contacto: '¿Comenzamos?',
}

const paginas = new Map()

for (const p of PAGES) {
  const ruta = rutaDe(p.slug)
  const res = await fetch(BASE + ruta)
  if (res.status !== 200) {
    falla(`${ruta}: respondió ${res.status}`)
    continue
  }
  const html = await res.text()
  paginas.set(p.slug, html)

  const marcador = MARCADORES[p.slug]
  if (marcador && !html.includes(marcador)) {
    falla(`${ruta}: el HTML servido no contiene "${marcador}" — ¿se inyecta por JS?`)
  }

  const h1 = (html.match(/<h1[\s>]/g) || []).length
  if (h1 !== 1) falla(`${ruta}: ${h1} etiquetas <h1>`)

  if (!/<html lang="es-[A-Z]{2}">/.test(html)) falla(`${ruta}: falta lang="es-*" en <html>`)
  if (!html.includes('application/ld+json')) falla(`${ruta}: sin datos estructurados`)
  for (const meta of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'twitter:card']) {
    if (!html.includes(`"${meta}"`)) falla(`${ruta}: falta ${meta}`)
  }
  if (p.slug !== '' && !html.includes('BreadcrumbList')) falla(`${ruta}: falta el BreadcrumbList`)
  if (p.slug === '' && !html.includes('"Organization"')) falla('/: falta el JSON-LD de Organization')
}

// --- Meta tags únicos. Un título repetido es lo mismo que no tenerlo. ---
for (const [campo, re] of [
  ['title', /<title>([^<]*)<\/title>/],
  ['description', /<meta name="description" content="([^"]*)"/],
  ['canonical', /<link rel="canonical" href="([^"]*)"/],
]) {
  const vistos = new Map()
  for (const [slug, html] of paginas) {
    const v = tag(html, re)
    if (!v) { falla(`${rutaDe(slug)}: sin ${campo}`); continue }
    if (vistos.has(v)) falla(`${campo} repetido entre ${rutaDe(vistos.get(v))} y ${rutaDe(slug)}: "${v}"`)
    else vistos.set(v, slug)
  }
}

for (const [slug, html] of paginas) {
  const t = tag(html, /<title>([^<]*)<\/title>/) || ''
  const d = tag(html, /<meta name="description" content="([^"]*)"/) || ''
  if (t.length > 60) falla(`${rutaDe(slug)}: título de ${t.length} caracteres`)
  if (d.length > 158) falla(`${rutaDe(slug)}: descripción de ${d.length} caracteres`)
}

// --- Enlaces internos: ninguno puede estar roto. ---
const revisados = new Map()
for (const [slug, html] of paginas) {
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
    const destino = m[1]
    if (!revisados.has(destino)) {
      const r = await fetch(BASE + destino, { method: 'GET' })
      revisados.set(destino, r.status)
    }
    if (revisados.get(destino) !== 200) {
      falla(`${rutaDe(slug)}: enlace roto a ${destino} (${revisados.get(destino)})`)
    }
  }
}

// --- Sitemap: las nueve rutas, sin sobrantes. ---
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text()
for (const p of PAGES) {
  const loc = p.slug ? `/${p.slug}</loc>` : `/</loc>`
  if (!sitemap.includes(loc)) falla(`sitemap.xml: falta ${rutaDe(p.slug)}`)
}
const locs = (sitemap.match(/<loc>/g) || []).length
if (locs !== PAGES.length) falla(`sitemap.xml: ${locs} URLs, esperaba ${PAGES.length}`)

const robots = await (await fetch(`${BASE}/robots.txt`)).text()
if (!robots.includes('Sitemap:')) falla('robots.txt: no apunta al sitemap')

// --- Redirección de anclas: el script tiene que estar en la home. ---
if (!paginas.get('')?.includes('window.location.hash')) {
  falla('/: falta el script de redirección de anclas viejas')
}

console.log(`${paginas.size} páginas · ${revisados.size} destinos internos verificados`)
if (fallas.length) {
  console.error(`\n${fallas.length} problemas:\n`)
  console.error(fallas.map((f) => `  ${f}`).join('\n'))
  process.exit(1)
}
console.log('todo en verde')
