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
    sections: ['servicios', 'servicios-prosa', 'servicios-hijas', ':faq', 'servicios-enlaces'],
    faq: [
      {
        q: '¿Hay que reemplazar los sistemas que ya tenemos?',
        a: '<p>Casi nunca. Trabajamos con arquitectura API, que integra lo que ya está funcionando en lugar de sustituirlo. Reemplazar un sistema central es el proyecto de mayor riesgo que puede encarar una empresa, y en la mayoría de los casos no hace falta.</p>',
      },
      {
        q: '¿Cómo sé cuál de los seis servicios necesito?',
        a: '<p>No hace falta que lo sepas de antemano. El Discovery arranca justamente por ahí: relevamos el ecosistema y de ese diagnóstico sale qué conviene resolver y en qué orden. Llegar con el problema alcanza.</p>',
      },
      {
        q: '¿Trabajan con cualquier plataforma?',
        a: '<p>Trabajamos con cualquier sistema que exponga una API o permita integración por algún medio, que hoy es la enorme mayoría. Cuando un sistema es realmente cerrado, lo detectamos en el Discovery y lo decimos antes de proponer nada, no después.</p>',
      },
      {
        q: '¿Qué tamaño de empresa atienden?',
        a: '<p>El límite no es el tamaño de la empresa sino el volumen de horas de desarrollo contra nuestra disponibilidad. Somos un equipo chico y senior: si un proyecto necesita una estructura mayor, lo planteamos en la primera conversación.</p>',
      },
      {
        q: '¿Se puede empezar por una parte y seguir después?',
        a: '<p>Es la forma en que trabajamos por defecto. El plan que sale del Discovery viene ordenado por fases y por criticidad, así se mantiene la operación andando y la inversión se reparte en el tiempo en lugar de concentrarse de una sola vez.</p>',
      },
    ],
  },
  {
    slug: 'proceso',
    title: 'Cómo trabajamos: del diagnóstico a la integración | INCBA',
    description:
      'Entendemos tu negocio antes que la tecnología. Conocé el proceso de INCBA: diagnóstico, arquitectura a medida, implementación y acompañamiento.',
    nav: 'Proceso',
    breadcrumb: 'Proceso',
    promoverH1: true,
    sections: ['proceso', ':faq', 'proceso-enlaces'],
    // Las preguntas salen de los miedos documentados en los arquetipos del plan
    // de marketing, no de suposiciones. Ninguna respuesta lleva cifras: los
    // valores concretos (precio del Discovery, plazos típicos) todavía no están
    // confirmados y no se inventan.
    faq: [
      {
        q: '¿El Discovery se cobra?',
        a: '<p>Sí. La primera conversación no tiene costo y sirve para entender si hay encaje. El Discovery es trabajo de relevamiento —documentar tu ecosistema, calcular horas, armar el plan por fases— y se cotiza aparte. El informe que sale de ahí queda en tu poder.</p>',
      },
      {
        q: '¿Qué pasa si después del Discovery decido no seguir?',
        a: '<p>Te quedás con el informe igual. Pagaste por el relevamiento, así que el documento es tuyo: el mapa de tu ecosistema y el plan de trabajo los podés usar internamente o con otro equipo. No hay cláusula que lo impida.</p>',
      },
      {
        q: '¿Tengo que parar la operación mientras trabajan?',
        a: '<p>No. Es justamente el motivo de trabajar por fases: nunca se interviene todo el sistema a la vez. Cada fase deja algo funcionando en producción antes de pasar a la siguiente, y los cambios se validan con vos antes de que salgan.</p>',
      },
      {
        q: '¿Quedo dependiendo de INCBA para siempre?',
        a: '<p>La arquitectura se documenta y queda documentada para tu equipo. Trabajamos integrando los sistemas que ya tenés en lugar de reemplazarlos por algo propietario, así que no hay una pieza nuestra de la que no puedas salir. El soporte posterior es una decisión tuya, no una condición.</p>',
      },
      {
        q: '¿Trabajan con empresas de cualquier tamaño?',
        a: '<p>El límite no lo pone el tamaño de la empresa sino el volumen de horas de desarrollo contra el tiempo que tenemos disponible. Somos un equipo chico y senior: hay proyectos que requieren una estructura más grande y, cuando es el caso, lo decimos en la primera conversación en lugar de tomarlo igual.</p>',
      },
      {
        q: '¿Por qué presentan más de una propuesta?',
        a: '<p>Porque casi nunca hay un solo camino razonable. Presentamos las opciones con sus valores y con el alcance explícito de cada una —qué incluye y qué no— para que la decisión sea tuya y con la información a la vista, en vez de un número único sin contexto.</p>',
      },
    ],
  },
  {
    slug: 'casos-de-exito',
    title: 'Casos de éxito en integración de sistemas | INCBA',
    description:
      'Casos reales de integración de ERP, CRM y eCommerce en empresas de comercio, industria y agroindustria, con resultados medidos y verificados.',
    nav: 'Casos de éxito',
    breadcrumb: 'Casos de éxito',
    promoverH1: true,
    sections: ['resultados', 'casos-prosa', ':faq', 'casos-enlaces'],
    faq: [
      {
        q: '¿Por qué no publican porcentajes de mejora?',
        a: '<p>Porque toda cifra que aparezca en el sitio tiene que estar respaldada por un proyecto real y verificada con el cliente. Preferimos no tener números antes que tener números decorativos. Estamos documentando los primeros casos bajo esa condición.</p>',
      },
      {
        q: '¿Cómo se mide si una integración funcionó?',
        a: '<p>Por tareas que dejan de hacerse, errores de carga que dejan de ocurrir y preguntas de negocio que pasan a poder responderse sin un trabajo previo de consolidación. Son cambios que el equipo nota en la semana siguiente a que algo entra en producción.</p>',
      },
      {
        q: '¿Puedo hablar con algún cliente actual?',
        a: '<p>Podemos coordinarlo según el caso y con la conformidad del cliente. Es la forma más honesta de referencia que existe, bastante más que un testimonio escrito en un sitio.</p>',
      },
    ],
  },
  {
    slug: 'por-que-incba',
    title: 'Consultora tecnológica boutique en {{countryPair}} | INCBA',
    description:
      'Ni software factory ni agencia digital. Equipo senior que se involucra en tu operación y diseña arquitectura a medida en lugar de conectar parches sueltos.',
    nav: 'Por qué INCBA',
    breadcrumb: 'Por qué INCBA',
    promoverH1: true,
    sections: ['diferencial', 'diferencial-prosa', 'manifesto', ':faq', 'diferencial-enlaces'],
    faq: [
      {
        q: '¿Cuál es la diferencia real con una software factory?',
        a: '<p>Una software factory ejecuta una especificación que le llega hecha. Nosotros empezamos por armar esa especificación: relevamos la operación antes de proponer tecnología. Cuando el pliego está mal desde el principio, ejecutarlo con precisión no salva el proyecto.</p>',
      },
      {
        q: '¿Son una agencia digital?',
        a: '<p>No. Una agencia trabaja sobre la capa visible: sitio, tienda, campañas. Nosotros trabajamos sobre la infraestructura que hay debajo. Si el stock de la tienda no coincide con el del depósito, ninguna mejora de la vidriera lo resuelve.</p>',
      },
      {
        q: '¿Un equipo de tres personas no es poco?',
        a: '<p>Para el tipo de proyecto que tomamos, es lo que permite que quien releva sea quien desarrolla, sin capas que degraden la información. Para proyectos que exceden esa capacidad lo decimos en la primera conversación en lugar de tomarlos igual.</p>',
      },
      {
        q: '¿Qué pasa si más adelante quiero cambiar de proveedor?',
        a: '<p>La arquitectura queda documentada y se apoya en los sistemas que ya tenías, no en piezas propietarias nuestras. Es una decisión de diseño deliberada: la dependencia del proveedor es uno de los miedos más razonables que tiene un cliente de este rubro.</p>',
      },
    ],
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
    sections: ['quienes-somos', 'equipo', 'equipo-prosa', ':faq', 'equipo-enlaces'],
    faq: [
      {
        q: '¿Con quién voy a trabajar durante el proyecto?',
        a: '<p>Con las mismas personas de la primera conversación. No hay un comercial que promete, un jefe de proyecto que traduce y un desarrollador que nunca te vio: quien releva tu ecosistema es quien después escribe el código.</p>',
      },
      {
        q: '¿Trabajan de forma remota?',
        a: '<p>Sí, con el equipo distribuido entre Córdoba y Temuco, y con instancias presenciales cuando el proyecto las justifica. En integraciones la distancia no es el factor crítico; el involucramiento sí.</p>',
      },
      {
        q: '¿Qué pasa si el proyecto excede la capacidad del equipo?',
        a: '<p>Lo decimos antes de empezar. El límite no lo pone el tamaño de tu empresa sino el volumen de horas contra nuestra disponibilidad, y preferimos no tomar un trabajo que después haya que estirar.</p>',
      },
    ],
  },
  {
    slug: 'partners',
    title: 'Programa de Partners white-label | INCBA',
    description:
      'Capacidad técnica senior para agencias y consultoras que necesitan resolver integraciones, arquitectura API y automatización bajo su propia marca.',
    nav: 'Partners',
    breadcrumb: 'Partners',
    promoverH1: true,
    sections: ['partners', 'partners-prosa', ':faq', 'partners-enlaces'],
    faq: [
      {
        q: '¿El cliente final se entera de que existen?',
        a: '<p>Solo si vos querés. El trabajo se entrega a tu nombre, no firmamos el entregable y no vamos a contactar a tu cliente por nuestra cuenta ni durante el proyecto ni después. Sin eso no hay acuerdo de partners que funcione.</p>',
      },
      {
        q: '¿Qué tipo de trabajo funciona mejor bajo este modelo?',
        a: '<p>Integraciones entre plataformas, arquitectura de APIs, automatización de procesos y desarrollos a medida acotados. Funciona peor cuando el proyecto exige presencia sostenida frente al cliente final, porque ahí la intermediación cuesta más de lo que aporta.</p>',
      },
      {
        q: '¿Participan de las reuniones con mi cliente?',
        a: '<p>Solo si nos lo pedís, y en ese caso vamos como parte de tu equipo. La relación comercial es tuya y la coordinación con el cliente también.</p>',
      },
    ],
  },
  {
    slug: 'clientes',
    title: 'Clientes y empresas que confían en INCBA',
    description:
      'Más de 15 empresas de comercio, industria y agroindustria en {{countryPair}} trabajan con INCBA para integrar y modernizar sus sistemas.',
    nav: 'Clientes',
    breadcrumb: 'Clientes',
    promoverH1: true,
    sections: ['clientes', 'clientes-prosa', ':faq', 'clientes-enlaces'],
    faq: [
      {
        q: '¿Trabajan solo con estos rubros?',
        a: '<p>Comercio, industria y agroindustria son donde más experiencia acumulamos, pero el problema de fondo —sistemas que no se hablan entre sí— es transversal. Lo que define si podemos ayudarte es el ecosistema que tenés, no la etiqueta del rubro.</p>',
      },
      {
        q: '¿Puedo ver un caso desarrollado de alguno de estos clientes?',
        a: '<p>Estamos documentando los primeros casos con métricas verificadas junto a los clientes. Mientras tanto, podemos coordinar una referencia directa según el caso.</p>',
      },
    ],
  },
  {
    slug: 'contacto',
    // El brief de SEO fijó estos dos literales como "diagnóstico sin costo",
    // pero se escribieron sin conocer el modelo comercial: el diagnóstico ES el
    // Discovery, y el Discovery se cobra. Lo gratuito es la primera conversación.
    // Prometer gratis algo que se factura obliga a desdecirse en la primera
    // llamada, justo con una audiencia cuyo miedo declarado es que le vendan humo.
    title: 'Contacto y primera consulta sin costo | INCBA',
    description:
      'Contanos qué sistemas necesitás integrar o qué procesos querés automatizar. La primera consulta con el equipo de INCBA en {{countryPair}} no tiene costo.',
    nav: null, // va como CTA del menú, no como enlace común
    breadcrumb: 'Contacto',
    promoverH1: true,
    sections: ['contacto', 'contacto-prosa', ':faq'],
    faq: [
      {
        q: '¿La primera consulta tiene costo?',
        a: '<p>No. Es una conversación para entender tu situación y ver si hay encaje. El Discovery, que es el relevamiento formal con informe y propuesta, sí se cotiza aparte.</p>',
      },
      {
        q: '¿Necesito tener claro qué quiero antes de escribir?',
        a: '<p>No hace falta. Alcanza con que sepas dónde se traba tu operación. Traducir eso a una solución técnica es parte de nuestro trabajo, no un requisito para contactarnos.</p>',
      },
      {
        q: '¿Atienden empresas fuera de Argentina y Chile?',
        a: '<p>Nuestra operación está enfocada en {{countryPair}}, que es donde tenemos equipo y conocemos el contexto. Consultas de otros países las evaluamos caso por caso, sin comprometer plazos que no podamos sostener.</p>',
      },
    ],
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
