/**
 * Fuente única de la configuración SEO del sitio.
 *
 * Antes, la variante chilena se producía haciendo cirugía de strings sobre el
 * index.html ya renderizado, con reglas que exigían una cantidad exacta de
 * coincidencias. Con una sola página eso era manejable. Con nueve, el <head>
 * quedaría replicado nueve veces y la deriva entre dominios sería cuestión de
 * semanas — que es exactamente el error que desindexaría incba.cl.
 *
 * Acá se invierte el modelo: los datos SEO son configuración, y las tres
 * variantes (AR, CL y staging) salen del mismo generador. La deriva deja de ser
 * posible por construcción. Los chequeos de invariantes de tools/build.mjs
 * siguen existiendo como red de seguridad.
 */

export const AR = 'https://incba.com.ar'
export const CL = 'https://incba.cl'

/**
 * Variantes de sitio.
 *
 * Ojo con `staging`: su canónica apunta a producción a propósito, y va sin
 * hreflang y con noindex. Un clon indexable de incba.com.ar le competiría por
 * las mismas búsquedas y se metería en el grupo hreflang AR/CL.
 */
export const SITES = {
  ar: {
    id: 'ar',
    host: AR,
    lang: 'es-AR',
    locale: 'es_AR',
    localeAlternate: 'es_CL',
    addressCountry: 'AR',
    areaServed: ['AR', 'CL'],
    countryPair: 'Argentina y Chile',
    countryPairAmp: 'Argentina &amp; Chile',
    keywordsTail: 'Argentina, Chile',
    robots: 'index, follow',
    hreflang: true,
    sitemap: true,
    cname: 'incba.com.ar',
  },
  cl: {
    id: 'cl',
    host: CL,
    lang: 'es-CL',
    locale: 'es_CL',
    localeAlternate: 'es_AR',
    addressCountry: 'CL',
    areaServed: ['CL', 'AR'],
    countryPair: 'Chile y Argentina',
    countryPairAmp: 'Chile &amp; Argentina',
    keywordsTail: 'Chile, Argentina',
    robots: 'index, follow',
    hreflang: true,
    sitemap: true,
    cname: 'incba.cl',
  },
  dev: {
    id: 'dev',
    // La canónica del staging apunta a producción: es la señal correcta para
    // que Google no lo trate como un sitio aparte.
    host: AR,
    lang: 'es-AR',
    locale: 'es_AR',
    localeAlternate: 'es_CL',
    addressCountry: 'AR',
    areaServed: ['AR', 'CL'],
    countryPair: 'Argentina y Chile',
    countryPairAmp: 'Argentina &amp; Chile',
    keywordsTail: 'Argentina, Chile',
    robots: 'noindex, nofollow',
    hreflang: false,
    sitemap: false,
    cname: 'test.incba.com.ar',
  },
}

/**
 * Las nueve páginas del sitio.
 *
 * - `slug`  — ruta sin barra final. El archivo se llama `<slug>.html` y GitHub
 *             Pages lo sirve en `/<slug>`. La home es `''` -> `index.html`.
 * - `title` — la marca va SIEMPRE de sufijo, nunca de gancho: la búsqueda
 *             "INCBA" la domina incba.org (International Cannabis Bar
 *             Association), un dominio más viejo y con mucha más autoridad.
 *             Cada título lidera con el término de búsqueda real.
 * - `nav`   — texto en el menú, o `null` si no va en el menú.
 * - `sections` — archivos de src/sections/ que componen la página, en orden.
 *
 * Topes que valida el build: título <= 60, descripción <= 158. Son los puntos
 * donde Google trunca.
 */
export const PAGES = [
  {
    slug: '',
    title: 'Integración de sistemas ERP, CRM y eCommerce | INCBA',
    description:
      'Consultora tecnológica en {{countryPair}}. Integramos eCommerce, ERP y CRM con arquitectura API, automatizamos procesos y preparamos tu empresa para IA.',
    nav: null,
    breadcrumb: null,
    sections: ['inicio', 'problema', 'solucion', 'resumenes'],
    // La home ya trae su <h1> en el hero: no hay <h2> que promover.
    // og:* se conservan tal como estaban — son más punchy que el title/description
    // para una tarjeta de LinkedIn, y no hay motivo para perderlos.
    ogTitle: 'INCBA — Technology Consulting',
    ogDescription:
      'Conectamos sistemas. Aceleramos negocios. Integración de eCommerce, ERP y CRM, automatización e IA aplicada para empresas de {{countryPair}}.',
  },
  {
    slug: 'servicios',
    title: 'Servicios de integración y automatización | INCBA',
    description:
      'Integración de plataformas, arquitectura API, modernización de sistemas, automatización de procesos e infraestructura para IA aplicada a tu negocio.',
    nav: 'Servicios',
    breadcrumb: 'Servicios',
    promoverH1: true,
    sections: ['servicios', 'servicios-enlaces'],
  },
  {
    slug: 'proceso',
    title: 'Cómo trabajamos: del diagnóstico a la integración | INCBA',
    description:
      'Entendemos tu negocio antes que la tecnología. Conocé el proceso de INCBA: diagnóstico, arquitectura a medida, implementación y acompañamiento.',
    nav: 'Proceso',
    breadcrumb: 'Proceso',
    promoverH1: true,
    sections: ['proceso', 'proceso-enlaces'],
  },
  {
    slug: 'casos-de-exito',
    title: 'Casos de éxito en integración de sistemas | INCBA',
    description:
      'Casos reales de integración de ERP, CRM y eCommerce en empresas de comercio, industria y agroindustria, con resultados medidos y verificados.',
    nav: 'Casos de éxito',
    breadcrumb: 'Casos de éxito',
    promoverH1: true,
    sections: ['resultados', 'casos-enlaces'],
  },
  {
    slug: 'por-que-incba',
    title: 'Consultora tecnológica boutique en {{countryPair}} | INCBA',
    description:
      'Ni software factory ni agencia digital. Equipo senior que se involucra en tu operación y diseña arquitectura a medida en lugar de conectar parches sueltos.',
    nav: 'Por qué INCBA',
    breadcrumb: 'Por qué INCBA',
    promoverH1: true,
    sections: ['diferencial', 'manifesto', 'diferencial-enlaces'],
  },
  {
    // Ruta que no está en el brief. Se agregó porque #quienes-somos y #equipo
    // no tenían destino asignado y, en una consultora boutique, las personas
    // son argumento de venta y no una nota al pie.
    slug: 'equipo',
    title: 'Equipo de consultores tecnológicos senior | INCBA',
    description:
      'Conocé al equipo de INCBA: perfiles full stack senior en integración de sistemas, arquitectura API y automatización, entre Córdoba y Temuco.',
    nav: 'Equipo',
    breadcrumb: 'Equipo',
    promoverH1: true,
    sections: ['quienes-somos', 'equipo', 'equipo-enlaces'],
  },
  {
    slug: 'partners',
    title: 'Programa de Partners white-label | INCBA',
    description:
      'Capacidad técnica senior para agencias y consultoras que necesitan resolver integraciones, arquitectura API y automatización bajo su propia marca.',
    nav: 'Partners',
    breadcrumb: 'Partners',
    promoverH1: true,
    sections: ['partners', 'partners-enlaces'],
  },
  {
    slug: 'clientes',
    title: 'Clientes y empresas que confían en INCBA',
    description:
      'Más de 15 empresas de comercio, industria y agroindustria en {{countryPair}} trabajan con INCBA para integrar y modernizar sus sistemas.',
    nav: 'Clientes',
    breadcrumb: 'Clientes',
    promoverH1: true,
    sections: ['clientes', 'clientes-enlaces'],
  },
  {
    slug: 'contacto',
    title: 'Contacto y diagnóstico sin costo | INCBA',
    description:
      'Contanos qué sistemas necesitás integrar o qué procesos querés automatizar. Agendá un diagnóstico sin costo con el equipo de INCBA en {{countryPair}}.',
    nav: null, // va como CTA del menú, no como enlace común
    breadcrumb: 'Contacto',
    promoverH1: true,
    sections: ['contacto'],
  },
]

/**
 * Rutas previstas que todavía no existen. Están acá para que sumarlas después
 * no requiera rehacer el routing:
 *
 *   /servicios/<slug>  — una página por servicio. El generador ya resuelve
 *                        slugs con barra: alcanza con agregar entradas a PAGES
 *                        con slug 'servicios/arquitectura-api' y crear el
 *                        archivo de sección. Los breadcrumbs anidan solos.
 *   /blog              — fuera de alcance de esta tarea.
 *
 * Los seis servicios, con los nombres exactos de marca:
 *   integración de plataformas · arquitectura API · modernización de sistemas
 *   automatización de procesos · infraestructura para IA · desarrollo estratégico
 */
export const RUTAS_PREVISTAS = ['servicios/:slug', 'blog']

/**
 * Anclas del sitio de una sola página. Circulan en enlaces ya compartidos y no
 * se pueden romper. Un #hash no llega al servidor, así que la redirección se
 * resuelve en el cliente (ver src/partials/redirect-hash.html).
 *
 * Se puede retirar a partir de 2027-02-11, seis meses después del cambio.
 */
export const ANCLAS_VIEJAS = {
  '#servicios': '/servicios',
  '#proceso': '/proceso',
  '#resultados': '/casos-de-exito',
  '#diferencial': '/por-que-incba',
  '#partners': '/partners',
  '#clientes': '/clientes',
  '#contacto': '/contacto',
  // Secciones que en el one-page no tenían enlace en el menú pero sí ancla.
  '#equipo': '/equipo',
  '#quienes-somos': '/equipo',
  '#problema': '/',
  '#solucion': '/',
  '#inicio': '/',
}

export const LIMITES = { title: 60, description: 158 }
