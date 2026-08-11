/**
 * Generador del sitio de INCBA.
 *
 *   node tools/build.mjs --site=ar   [--out DIR]   -> incba.com.ar
 *   node tools/build.mjs --site=cl   [--out DIR]   -> incba.cl
 *   node tools/build.mjs --site=dev  [--out DIR]   -> test.incba.com.ar (noindex)
 *
 * Las nueve páginas se arman con los partials de src/partials/ y las secciones
 * de src/sections/, que son recortes literales del sitio de una sola página.
 * Todo lo que cambia entre dominios sale de src/site.config.mjs.
 *
 * El build es determinista: mismas entradas, mismo byte de salida. Por eso el
 * `lastmod` del sitemap es una constante y no la fecha de hoy — así el CI puede
 * regenerar el sitio argentino y comparar contra lo commiteado para detectar
 * que alguien editó un .html de la raíz a mano.
 */

import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync, cpSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AR, CL, SITES, PAGES, LIMITES, ANCLAS_VIEJAS } from '../src/site.config.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')

/**
 * Fecha de última modificación del contenido, para el sitemap. Se actualiza a
 * mano cuando el contenido cambia de verdad. Una fecha de build automática
 * diría "cambió hoy" en cada deploy aunque no se haya tocado nada, que es
 * justamente la señal que Google aprende a ignorar.
 */
const LASTMOD = '2026-08-11'

const KEYWORDS_BASE =
  'consultora tecnológica, integración empresarial, arquitectura API, automatización, ' +
  'inteligencia artificial, ERP, CRM, eCommerce'

// ---------------------------------------------------------------- utilidades

const read = (...p) => readFileSync(join(SRC, ...p), 'utf8')
const countOf = (hay, needle) => hay.split(needle).length - 1
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Sustituye {{clave}} por su valor. Se aplica al documento entero, así los
 *  tokens de país también funcionan dentro de las secciones de contenido. */
function fill(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m))
}

const urlOf = (site, slug) => (slug ? `${site.host}/${slug}` : `${site.host}/`)
const pathOf = (slug) => (slug ? `/${slug}` : '/')

// ------------------------------------------------------------------ fragmentos

/** Grupo hreflang de una página. Las referencias tienen que ser recíprocas y
 *  cada página incluirse a sí misma, o Google descarta el grupo entero y deja
 *  de mostrar el dominio correcto por país. */
function hreflangBlock(site, slug) {
  if (!site.hreflang) {
    return '\n  <!-- Staging: el bloque hreflang se quita a propósito, este sitio no se indexa. -->\n'
  }
  const ar = slug ? `${AR}/${slug}` : `${AR}/`
  const cl = slug ? `${CL}/${slug}` : `${CL}/`
  return `
  <!-- Versiones por país. El bloque es idéntico en incba.com.ar e incba.cl:
       Google exige que las referencias sean recíprocas y que cada página
       se incluya a sí misma, o descarta todo el grupo. -->
  <link rel="alternate" hreflang="es-AR" href="${ar}">
  <link rel="alternate" hreflang="es-CL" href="${cl}">
  <!-- Hispanohablante de otro país (MX, PE, ES...): cae en el sitio argentino. -->
  <link rel="alternate" hreflang="es" href="${ar}">
  <link rel="alternate" hreflang="x-default" href="${ar}">
`
}

function jsonLd(site, page) {
  const blocks = []

  if (page.slug === '') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'INCBA Technology Consulting',
      alternateName: 'INCBA',
      url: site.host,
      logo: `${site.host}/img/logo-light.png`,
      description:
        'Consultora tecnológica que integra eCommerce, ERP y CRM mediante arquitectura API, ' +
        'automatiza procesos y prepara la infraestructura para inteligencia artificial aplicada.',
      areaServed: site.areaServed.map((c) => ({ '@type': 'Country', name: c })),
      // Se completa cuando existan los perfiles. Va vacío a propósito, para que
      // sumarlos después sea agregar strings y no rehacer el bloque.
      sameAs: [],
    })
    // Se conserva junto al Organization: describe cosas que Organization no
    // cubre (serviceType, knowsAbout) y sacarlo sería perder señal.
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'INCBA Technology Consulting',
      url: site.host,
      logo: `${site.host}/img/logo-light.png`,
      description:
        'Consultora tecnológica especializada en integración de sistemas, automatización e inteligencia artificial aplicada para empresas.',
      address: { '@type': 'PostalAddress', addressCountry: site.addressCountry },
      areaServed: site.areaServed,
      serviceType: [
        'Consultoría tecnológica',
        'Integración de sistemas',
        'Automatización',
        'Inteligencia artificial aplicada',
      ],
      knowsAbout: ['ERP', 'CRM', 'eCommerce', 'API', 'IA', 'Automatización'],
      sameAs: [],
    })
  } else {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${site.host}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: page.breadcrumb,
          item: urlOf(site, page.slug),
        },
      ],
    })
  }

  return blocks
    .map((b) => `  <script type="application/ld+json">\n${JSON.stringify(b, null, 2).replace(/^/gm, '  ')}\n  </script>`)
    .join('\n')
}

function navLinks(currentSlug) {
  return PAGES.filter((p) => p.nav)
    .map((p) => {
      const current = p.slug === currentSlug ? ' aria-current="page"' : ''
      return `        <a href="${pathOf(p.slug)}"${current}>${p.nav}</a>`
    })
    .join('\n')
}

function breadcrumbs(page) {
  if (!page.breadcrumb) return ''
  return `  <div class="page-top">
    <div class="container">
      <nav class="breadcrumbs" aria-label="Ruta de navegación">
        <a href="/">Inicio</a>
        <span class="sep" aria-hidden="true">›</span>
        <span aria-current="page">${esc(page.breadcrumb)}</span>
      </nav>
    </div>
  </div>

`
}

/**
 * Redirección de las anclas del sitio viejo. Un #hash no llega al servidor, así
 * que no hay forma de resolverlo con un 301 real: se hace en el cliente, inline
 * en el <head> para que dispare antes de pintar y no se vea un salto.
 *
 * Los enlaces con estas anclas ya circulan por ahí y no se pueden romper.
 * Se puede retirar a partir de 2027-02-11.
 */
function redirectHash() {
  const map = JSON.stringify(ANCLAS_VIEJAS)
  return `  <!-- Anclas del sitio de una sola página -> rutas nuevas. Retirable desde 2027-02-11. -->
  <script>
    (function () {
      var m = ${map};
      var d = m[window.location.hash];
      if (d && d !== window.location.pathname) window.location.replace(d);
    })();
  </script>
`
}

// --------------------------------------------------------------------- páginas

function buildPage(site, page, sections, partials) {
  const vars = {
    lang: site.lang,
    host: site.host,
    locale: site.locale,
    localeAlternate: site.localeAlternate,
    robots: site.robots,
    countryPair: site.countryPair,
    countryPairAmp: site.countryPairAmp,
  }

  const title = fill(page.title, vars)
  const description = fill(page.description, vars)

  let body = page.sections
    .map((name) => {
      if (!(name in sections)) throw new Error(`falta src/sections/${name}.html (página /${page.slug})`)
      return sections[name]
    })
    .join('\n')

  // Una <h1> por página. Las secciones vienen del sitio de una sola página, donde
  // todas abrían con <h2> porque la única <h1> era la del hero. En las internas
  // se promueve el primer <h2> de la sección principal: es reubicación
  // jerárquica, no reescritura de texto.
  if (page.promoverH1) {
    const before = body
    body = body.replace(/<h2>/, '<h1>').replace(/<\/h2>/, '</h1>')
    if (body === before) throw new Error(`/${page.slug}: no se encontró el <h2> a promover`)
  }

  const head = fill(partials.head, {
    ...vars,
    title: esc(title),
    description: esc(description),
    keywords: `${KEYWORDS_BASE}, ${site.keywordsTail}`,
    canonical: urlOf(site, page.slug),
    hreflang: hreflangBlock(site, page.slug),
    ogTitle: esc(fill(page.ogTitle || page.title, vars)),
    ogDescription: esc(fill(page.ogDescription || page.description, vars)),
    jsonld: jsonLd(site, page),
    headExtra: page.slug === '' ? redirectHash() : '',
  })

  const nav = fill(partials.nav, {
    navLinks: navLinks(page.slug),
    ctaCurrent: page.slug === 'contacto' ? ' aria-current="page"' : '',
  })

  // El <main> no es sólo semántica: es el que permite anclar el footer abajo en
  // las páginas cortas, que en el sitio de una sola página nunca hacían falta.
  const html = fill(
    [head, nav, '', '  <main>', breadcrumbs(page) + body, '  </main>', '', partials.footer].join('\n'),
    vars
  )

  return { title, description, canonical: urlOf(site, page.slug), html }
}

// ----------------------------------------------------------------- validación

function validate(site, built) {
  const problems = []
  const seen = { title: new Map(), description: new Map(), canonical: new Map() }

  for (const [slug, page] of built) {
    const ruta = pathOf(slug)

    if (page.title.length > LIMITES.title) {
      problems.push(`${ruta}: título de ${page.title.length} caracteres (máximo ${LIMITES.title})`)
    }
    if (page.description.length > LIMITES.description) {
      problems.push(`${ruta}: descripción de ${page.description.length} caracteres (máximo ${LIMITES.description})`)
    }

    // Un título repetido es lo mismo que no tener título.
    for (const campo of ['title', 'description', 'canonical']) {
      const previo = seen[campo].get(page[campo])
      if (previo !== undefined) problems.push(`${ruta}: ${campo} repetido, ya lo usa ${pathOf(previo)}`)
      else seen[campo].set(page[campo], slug)
    }

    const h1 = countOf(page.html, '<h1')
    if (h1 !== 1) problems.push(`${ruta}: ${h1} etiquetas <h1> (tiene que haber exactamente 1)`)

    const sinResolver = page.html.match(/\{\{\w+\}\}/g)
    if (sinResolver) problems.push(`${ruta}: tokens sin resolver ${[...new Set(sinResolver)].join(', ')}`)

    // Las rutas sin barra final significan que un src relativo se rompe en
    // cuanto exista /servicios/<slug>. Todos los assets van absolutos.
    const relativos = page.html.match(/(?:src|href)="(?:img|css|js|site\.webmanifest)/g)
    if (relativos) problems.push(`${ruta}: ${relativos.length} rutas de asset relativas`)

    // Anclas a secciones que se fueron a otra página: enlace roto silencioso.
    for (const ancla of page.html.match(/href="#[\w-]+"/g) || []) {
      const id = ancla.slice(7, -1)
      if (!page.html.includes(`id="${id.slice(1)}"`)) {
        problems.push(`${ruta}: enlace a ${id} pero esa sección no está en esta página`)
      }
    }
  }

  // Invariantes por dominio. Sin esto, el espejo chileno se publica con las
  // etiquetas SEO de Argentina, que es el error que lo desindexaría.
  if (site.id === 'cl') {
    for (const [slug, page] of built) {
      const restos = countOf(page.html, `${AR}/`) + countOf(page.html, `"${AR}"`)
      if (restos !== 3) {
        problems.push(
          `${pathOf(slug)}: ${restos} referencias a incba.com.ar en el HTML chileno ` +
            `(deberían ser 3: hreflang es-AR, es y x-default)`
        )
      }
    }
  }

  if (site.id === 'dev') {
    for (const [slug, page] of built) {
      if (!page.html.includes('content="noindex, nofollow"')) {
        problems.push(`${pathOf(slug)}: falta el noindex del staging`)
      }
      if (countOf(page.html, 'hreflang=') !== 0) {
        problems.push(`${pathOf(slug)}: quedaron etiquetas hreflang en el staging`)
      }
    }
  }

  return problems
}

// -------------------------------------------------------------- robots/sitemap

function robotsTxt(site) {
  if (!site.sitemap) return '# Staging. No indexar.\nUser-agent: *\nDisallow: /\n'
  return `User-agent: *\nAllow: /\nSitemap: ${site.host}/sitemap.xml\n`
}

function sitemapXml(site) {
  const urls = PAGES.map((p) => {
    const ar = p.slug ? `${AR}/${p.slug}` : `${AR}/`
    const cl = p.slug ? `${CL}/${p.slug}` : `${CL}/`
    return `  <url>
    <loc>${urlOf(site, p.slug)}</loc>
    <xhtml:link rel="alternate" hreflang="es-AR" href="${ar}"/>
    <xhtml:link rel="alternate" hreflang="es-CL" href="${cl}"/>
    <xhtml:link rel="alternate" hreflang="es" href="${ar}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ar}"/>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${p.slug === '' ? '1.0' : '0.8'}</priority>
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
}

// -------------------------------------------------------------------- programa

export function build({ siteId, out }) {
  const site = SITES[siteId]
  if (!site) throw new Error(`sitio desconocido: ${siteId} (esperaba ar, cl o dev)`)

  const partials = {
    head: read('partials', 'head.html'),
    nav: read('partials', 'nav.html'),
    footer: read('partials', 'footer.html'),
  }

  const sections = {}
  for (const f of readdirSync(join(SRC, 'sections'))) {
    if (f.endsWith('.html')) sections[f.slice(0, -5)] = read('sections', f)
  }

  const built = PAGES.map((p) => [p.slug, buildPage(site, p, sections, partials)])

  const problems = validate(site, built)
  if (problems.length) {
    console.error(`\nEl build de ${siteId} no pasa las validaciones:\n`)
    console.error(problems.map((p) => `  ${p}`).join('\n'))
    console.error('\nNada se escribió en disco.\n')
    process.exit(1)
  }

  const dir = join(ROOT, out)
  // Con --out . se escribe sobre el repo: no se borra nada, se sobrescriben
  // los archivos generados y listo.
  if (out !== '.') {
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    for (const asset of ['css', 'js', 'img']) {
      cpSync(join(ROOT, asset), join(dir, asset), { recursive: true })
    }
    cpSync(join(ROOT, 'site.webmanifest'), join(dir, 'site.webmanifest'))
    writeFileSync(join(dir, 'CNAME'), `${site.cname}\n`)
    writeFileSync(join(dir, '.nojekyll'), '')
  }

  for (const [slug, page] of built) {
    writeFileSync(join(dir, slug ? `${slug}.html` : 'index.html'), page.html)
  }
  writeFileSync(join(dir, 'robots.txt'), robotsTxt(site))
  if (site.sitemap) writeFileSync(join(dir, 'sitemap.xml'), sitemapXml(site))

  return { site, count: built.length, dir: out }
}

const DEFAULT_OUT = { ar: 'dist-ar', cl: 'dist-cl', dev: 'dist-dev' }

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=')
      return [k, v ?? true]
    })
  )
  const siteId = args.site || 'ar'
  const out = args.out || DEFAULT_OUT[siteId]
  const r = build({ siteId, out })
  console.log(`${siteId}: ${r.count} páginas en ${r.dir}/ (${r.site.cname})`)
}
