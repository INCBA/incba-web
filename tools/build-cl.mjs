/**
 * Genera el sitio de incba.cl.
 *
 *   node tools/build-cl.mjs   ->  dist-cl/
 *
 * incba.com.ar e incba.cl son el mismo sitio con distinta orientación de país.
 * En vez de mantener dos copias del HTML, la versión chilena sale del mismo
 * generador que la argentina, así el contenido nunca se desincroniza.
 *
 * Antes este script hacía cirugía de strings sobre index.html, con una lista de
 * reemplazos que exigía la cantidad exacta de coincidencias de cada uno. Esa
 * verificación existía porque el error que había que evitar es grave: si
 * incba.cl se publica con la canónica apuntando a incba.com.ar, Google deja de
 * indexar el dominio chileno.
 *
 * Con nueve páginas ese modelo ya no se sostiene, así que la protección cambió
 * de lugar: lo que varía por país ahora es configuración (src/site.config.mjs) y
 * no texto a reemplazar, y el chequeo pasó a ser una invariante sobre la salida
 * —ninguna página puede tener más de las tres referencias de hreflang a
 * incba.com.ar—, que es la condición que de verdad importa. Vive en
 * tools/build.mjs y aborta el build sin escribir nada.
 */

import { build } from './build.mjs'

const r = build({ siteId: 'cl', out: 'dist-cl' })
console.log(`incba.cl generado en dist-cl/ (${r.count} páginas)`)
