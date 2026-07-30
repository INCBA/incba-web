/**
 * Genera el sitio de incba.cl a partir del de incba.com.ar.
 *
 * incba.com.ar e incba.cl son el mismo sitio con distinta orientación de país.
 * En vez de mantener dos copias del HTML, la versión chilena se deriva de
 * index.html en cada deploy, así el contenido nunca se desincroniza.
 *
 * Uso:  node tools/build-cl.mjs   ->  genera dist-cl/
 */

import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'dist-cl')

const AR = 'https://incba.com.ar'
const CL = 'https://incba.cl'
const BUILD_DATE = new Date().toISOString().slice(0, 10)

/**
 * Reemplazos para la variante chilena, con la cantidad exacta de coincidencias
 * que debe encontrar cada uno. Si index.html cambia y una regla deja de
 * coincidir, el build falla en vez de publicar incba.cl con las etiquetas SEO
 * apuntando a Argentina, que es el error que desindexaría el dominio.
 *
 * Ojo: las etiquetas hreflang NO se tocan. Son idénticas en ambos dominios
 * porque Google exige que las referencias sean recíprocas.
 */
const RULES = [
  // --- Idioma y orientación de país ---
  ['<html lang="es-AR">', '<html lang="es-CL">', 1],
  [
    '<title>INCBA — Consultora Tecnológica en Argentina | Conectamos sistemas. Aceleramos negocios.</title>',
    '<title>INCBA — Consultora Tecnológica en Chile | Conectamos sistemas. Aceleramos negocios.</title>',
    1,
  ],
  // Cubre description, og:description, twitter:description, la tarjeta
  // "Experiencia regional" y el tagline del footer.
  ['Argentina y Chile', 'Chile y Argentina', 5],
  // Badge del hero y bloque de contacto.
  ['Argentina &amp; Chile', 'Chile &amp; Argentina', 2],
  ['eCommerce, Argentina, Chile"', 'eCommerce, Chile, Argentina"', 1],

  // --- URLs canónicas y sociales ---
  [`<link rel="canonical" href="${AR}/">`, `<link rel="canonical" href="${CL}/">`, 1],
  [`<meta property="og:url" content="${AR}/">`, `<meta property="og:url" content="${CL}/">`, 1],
  [`${AR}/img/og-image.jpg`, `${CL}/img/og-image.jpg`, 2],
  ['<meta property="og:locale" content="es_AR">', '<meta property="og:locale" content="es_CL">', 1],
  [
    '<meta property="og:locale:alternate" content="es_CL">',
    '<meta property="og:locale:alternate" content="es_AR">',
    1,
  ],

  // --- Datos estructurados ---
  [`"url": "${AR}",`, `"url": "${CL}",`, 1],
  [`"logo": "${AR}/img/logo-light.png",`, `"logo": "${CL}/img/logo-light.png",`, 1],
  ['"addressCountry": "AR"', '"addressCountry": "CL"', 1],
  ['"areaServed": ["AR", "CL"],', '"areaServed": ["CL", "AR"],', 1],
]

const ROBOTS = `User-agent: *
Allow: /
Sitemap: ${CL}/sitemap.xml
`

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${CL}/</loc>
    <xhtml:link rel="alternate" hreflang="es-AR" href="${AR}/"/>
    <xhtml:link rel="alternate" hreflang="es-CL" href="${CL}/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${AR}/"/>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

function countOf(haystack, needle) {
  return haystack.split(needle).length - 1
}

function build() {
  let html = readFileSync(join(ROOT, 'index.html'), 'utf8')

  const problems = []
  for (const [from, to, expected] of RULES) {
    const found = countOf(html, from)
    if (found !== expected) {
      problems.push(`  ${found} de ${expected} coincidencias: ${JSON.stringify(from.slice(0, 78))}`)
      continue
    }
    html = html.split(from).join(to)
  }

  if (problems.length) {
    console.error('\nEl build de incba.cl no coincide con index.html:\n')
    console.error(problems.join('\n'))
    console.error(
      '\nAlguien editó index.html sin actualizar tools/build-cl.mjs.' +
        '\nAjustá las reglas antes de publicar, o incba.cl queda con SEO de incba.com.ar.\n'
    )
    process.exit(1)
  }

  // Sólo deben sobrevivir las dos referencias a incba.com.ar de hreflang
  // (es-AR y x-default). Cualquier otra significa una URL sin traducir.
  const leftovers = countOf(html, `${AR}/`) + countOf(html, `"${AR}"`)
  if (leftovers !== 2) {
    console.error(
      `\nQuedaron ${leftovers} URLs de incba.com.ar en el HTML chileno (deberían ser 2: hreflang es-AR y x-default).\n`
    )
    process.exit(1)
  }

  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })

  for (const asset of ['css', 'js', 'img']) {
    cpSync(join(ROOT, asset), join(OUT, asset), { recursive: true })
  }
  cpSync(join(ROOT, 'site.webmanifest'), join(OUT, 'site.webmanifest'))

  writeFileSync(join(OUT, 'index.html'), html)
  writeFileSync(join(OUT, 'robots.txt'), ROBOTS)
  writeFileSync(join(OUT, 'sitemap.xml'), SITEMAP)
  writeFileSync(join(OUT, 'CNAME'), 'incba.cl\n')
  writeFileSync(join(OUT, '.nojekyll'), '')

  console.log(`incba.cl generado en dist-cl/ (${RULES.length} reglas aplicadas, ${BUILD_DATE})`)
}

build()
