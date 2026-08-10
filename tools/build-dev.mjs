/**
 * Genera el sitio de staging (dev.incba.com.ar) a partir de index.html.
 *
 * El contenido es idéntico al de producción a propósito: la idea de un staging
 * es mirar exactamente lo que se va a publicar. Lo único que cambia es que este
 * sitio NO se indexa.
 *
 * Por qué importa: un clon indexable de incba.com.ar competiría con el original
 * por las mismas búsquedas y, peor, se metería en el grupo hreflang AR/CL. Por
 * eso acá se fuerza noindex, se saca el bloque hreflang y el robots.txt bloquea
 * todo. La canónica se deja apuntando a producción, que es la señal correcta.
 *
 * Uso:  node tools/build-dev.mjs   ->  genera dist-dev/
 */

import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'dist-dev')

const DEV_HOST = 'dev.incba.com.ar'

const HREFLANG_BLOCK = `  <!-- Versiones por país. El bloque es idéntico en incba.com.ar e incba.cl:
       Google exige que las referencias sean recíprocas y que cada página
       se incluya a sí misma, o descarta todo el grupo. -->
  <link rel="alternate" hreflang="es-AR" href="https://incba.com.ar/">
  <link rel="alternate" hreflang="es-CL" href="https://incba.cl/">
  <!-- Hispanohablante de otro país (MX, PE, ES...): cae en el sitio argentino. -->
  <link rel="alternate" hreflang="es" href="https://incba.com.ar/">
  <link rel="alternate" hreflang="x-default" href="https://incba.com.ar/">`

/**
 * Igual que build-cl.mjs: cada regla declara cuántas coincidencias debe
 * encontrar. Si index.html cambia y una deja de matchear, el build falla en vez
 * de publicar un staging indexable.
 */
const RULES = [
  [
    '<meta name="robots" content="index, follow">',
    '<meta name="robots" content="noindex, nofollow">',
    1,
  ],
  [
    HREFLANG_BLOCK,
    '  <!-- Staging: el bloque hreflang se quita a propósito, este sitio no se indexa. -->',
    1,
  ],
]

const ROBOTS = `# Staging. No indexar.
User-agent: *
Disallow: /
`

function countOf(haystack, needle) {
  return haystack.split(needle).length - 1
}

function build() {
  // Normalizado a LF: en Windows el working copy queda con CRLF y el bloque
  // hreflang, que ocupa varias líneas, no matchearía.
  let html = readFileSync(join(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n')

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
    console.error('\nEl build de staging no coincide con index.html:\n')
    console.error(problems.join('\n'))
    console.error(
      '\nAlguien editó index.html sin actualizar tools/build-dev.mjs.' +
        '\nAjustá las reglas antes de publicar, o dev queda indexable y le compite a producción.\n'
    )
    process.exit(1)
  }

  // Invariantes que no se negocian: sin ellos el staging daña el SEO de producción.
  if (!html.includes('content="noindex, nofollow"')) {
    console.error('\nFaltó el noindex en el HTML de staging.\n')
    process.exit(1)
  }
  if (countOf(html, 'hreflang=') !== 0) {
    console.error('\nQuedaron etiquetas hreflang en el staging.\n')
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
  writeFileSync(join(OUT, 'CNAME'), `${DEV_HOST}\n`)
  writeFileSync(join(OUT, '.nojekyll'), '')
  // Sin sitemap.xml: un staging no se anuncia a los buscadores.

  console.log(`staging generado en dist-dev/ (noindex, ${RULES.length} reglas aplicadas)`)
}

build()
