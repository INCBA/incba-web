/**
 * Genera el sitio de incba.cl.
 *
 * La portada chilena vive en _cl/index.html: tiene su propio <head>, su hero y
 * su historia. Las secciones que comparte con incba.com.ar no se copian a mano:
 * _cl/index.html lleva un marcador <!-- incluir:id --> y el build pone ahí la
 * <section id="id"> de index.html, con los CTA de WhatsApp y el correo de Chile.
 *
 * Antes de escribir nada, la salida pasa por invariantes (SEO, Meta, píxel,
 * historia). Si alguna falla, el build sale con error y dist-cl/ no se toca.
 *
 * _cl/ empieza con guion bajo para que Jekyll no la publique en incba.com.ar.
 *
 * Uso:  node tools/build-cl.mjs   ->  genera dist-cl/
 */

import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'dist-cl')

const AR = 'https://incba.com.ar'
const CL = 'https://incba.cl'
const FB = 'dakeik5ldma7s0z9idjeu1b3v4fso3'

// Todo a LF: con core.autocrlf=true la copia local queda en CRLF y el CI en LF.
const lf = (s) => s.replace(/\r\n/g, '\n')
const cuenta = (h, n) => h.split(n).length - 1
const leer = (ruta) => lf(readFileSync(join(ROOT, ruta), 'utf8'))

/** La <section id="id"> de primer nivel de html (index.html no anida <section>). */
export function seccion(html, id) {
  const re = /<(\/?)section\b[^>]*>/g
  let m, d = 0, ini = -1
  while ((m = re.exec(html))) {
    if (!m[1]) { if (d === 0 && m[0].includes(`id="${id}"`)) ini = m.index; d++ }
    else { d--; if (d === 0 && ini >= 0) return html.slice(ini, re.lastIndex) }
  }
  throw new Error(`index.html no tiene <section id="${id}">. ¿Se renombró? Actualiza el marcador en _cl/index.html.`)
}

/** Sólo los CTA de WhatsApp (llevan ?text=) y el correo. El teléfono AR de la lista de contacto queda. */
export const aChile = (s) =>
  s.split('https://wa.me/5493517422702?text=').join('https://wa.me/56957400433?text=')
    .split('contacto@incba.com.ar').join('contacto@incba.cl')

export function resolver(fuente, ar) {
  return fuente.replace(/<!-- incluir:([\w-]+) -->/g, (_, id) => aChile(seccion(ar, id)))
}

/** Devuelve { nombre: bool } con cada invariante de la salida. */
export function invariantes(html, ar) {
  const hreflang = (s) => (s.match(/<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g) || []).join('\n')
  // Los <script> del <head> tienen que ser los de AR: ahí están la media query
  // de la historia y la guarda del píxel.
  const scriptsHead = (s) => s.slice(s.indexOf('<script>'), s.indexOf('</head>')).replace(/^\s*\/\/.*\n/gm, '')
  let jsonld = null
  try { jsonld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]) } catch {}
  const caps = [...html.matchAll(/<div class="cap"[^>]*data-clave="([^"]+)"[^>]*--fila:(\d+)/g)].map((m) => [m[1], +m[2]])
  const pasos = [...html.matchAll(/<li data-paso="([^"]+)"/g)].map((m) => m[1])
  const assets = [...html.matchAll(/(?:src|href)="((?:css|js|img)\/[^"#?]+)"/g)].map((m) => m[1])
  const faltantes = assets.filter((a) => !existsSync(join(ROOT, decodeURIComponent(a))))

  return {
    'lang es-CL': cuenta(html, '<html lang="es-CL">') === 1,
    'una sola canónica, la de incba.cl': cuenta(html, `<link rel="canonical" href="${CL}/">`) === 1 && cuenta(html, 'rel="canonical"') === 1,
    'hreflang idéntico al de index.html (4 líneas)': hreflang(html) === hreflang(ar) && hreflang(ar).split('\n').length === 4,
    'metaetiqueta de Meta exacta, una vez': cuenta(html, `<meta name="facebook-domain-verification" content="${FB}" />`) === 1,
    'indexable': cuenta(html, 'content="index, follow"') === 1 && !html.includes('noindex'),
    'sólo 3 URLs de incba.com.ar (las de hreflang)': cuenta(html, `${AR}/`) + cuenta(html, `"${AR}"`) === 3,
    'ningún CTA con el WhatsApp AR': cuenta(html, 'wa.me/5493517422702?text=') === 0,
    'ningún contacto@incba.com.ar': cuenta(html, 'contacto@incba.com.ar') === 0,
    'JSON-LD de Chile': !!jsonld && jsonld.url === CL && jsonld.address?.addressCountry === 'CL' &&
      String(jsonld.telephone).startsWith('+56') && !jsonld.address?.addressLocality,
    'guarda del píxel': html.includes(String.raw`window.INCBA_PIXEL_ON = /^(www\.)?(incba\.com\.ar|incba\.cl)$/.test(location.hostname);`),
    'scripts del <head> iguales a los de index.html (sin contar comentarios)': scriptsHead(html) === scriptsHead(ar),
    '9 capítulos con --fila de 3 a 11': caps.length === 9 && caps.every(([, f], i) => f === i + 3),
    'consulta primero y cierre último': caps[0]?.[0] === 'consulta' && caps.at(-1)?.[0] === 'cierre',
    'la primera pantalla es el chat': /<figure class="pantalla-h ph-chat[^"]*" data-clave="consulta"/.test(html),
    '5 pasos y cada uno es un capítulo': pasos.length === 5 && pasos.every((p) => caps.some(([c]) => c === p)),
    'ningún marcador sin resolver': !/<!-- incluir:/.test(html),
    [`assets relativos existentes (${assets.length}${faltantes.length ? `; faltan ${faltantes.join(', ')}` : ''})`]: faltantes.length === 0,
  }
}

// La fecha del último commit, no la del build: así sitemap.xml no cambia en cada deploy.
function fechaCommit() {
  return execFileSync('git', ['log', '-1', '--format=%cs'], { cwd: ROOT, encoding: 'utf8' }).trim()
}

const robots = () => `User-agent: *
Allow: /
Sitemap: ${CL}/sitemap.xml
`

const sitemap = (lastmod) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${CL}/</loc>
    <xhtml:link rel="alternate" hreflang="es-AR" href="${AR}/"/>
    <xhtml:link rel="alternate" hreflang="es-CL" href="${CL}/"/>
    <xhtml:link rel="alternate" hreflang="es" href="${AR}/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${AR}/"/>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

function build() {
  const ar = leer('index.html')
  let html
  try {
    html = resolver(leer('_cl/index.html'), ar)
  } catch (e) {
    console.error(`\n${e.message}\n`)
    process.exit(1)
  }

  const checks = invariantes(html, ar)
  const fallas = Object.keys(checks).filter((k) => !checks[k])
  if (fallas.length) {
    console.error('\nEl build de incba.cl no cumple estas invariantes (dist-cl/ no se tocó):\n')
    console.error(fallas.map((k) => `  FALLA ${k}`).join('\n'))
    console.error('\nRevisa _cl/index.html o lo que cambió en index.html antes de publicar.\n')
    process.exit(1)
  }

  const lastmod = fechaCommit()

  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  for (const asset of ['css', 'js', 'img']) {
    cpSync(join(ROOT, asset), join(OUT, asset), { recursive: true })
  }
  cpSync(join(ROOT, 'site.webmanifest'), join(OUT, 'site.webmanifest'))

  writeFileSync(join(OUT, 'index.html'), html)
  writeFileSync(join(OUT, 'robots.txt'), robots())
  writeFileSync(join(OUT, 'sitemap.xml'), sitemap(lastmod))
  writeFileSync(join(OUT, 'CNAME'), 'incba.cl\n')
  writeFileSync(join(OUT, '.nojekyll'), '')

  console.log(`incba.cl generado en dist-cl/ (${Object.keys(checks).length} invariantes OK, lastmod ${lastmod})`)
}

// La forma con `file://${process.argv[1]}` no funciona en Windows.
if (import.meta.url === pathToFileURL(process.argv[1]).href) build()
