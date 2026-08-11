/**
 * Genera el sitio de staging (test.incba.com.ar).
 *
 *   node tools/build-dev.mjs   ->  dist-dev/
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
 * Esas tres condiciones se verifican como invariantes sobre la salida en
 * tools/build.mjs: si alguna no se cumple, el build aborta sin escribir nada en
 * vez de publicar un staging indexable.
 */

import { build } from './build.mjs'

const r = build({ siteId: 'dev', out: 'dist-dev' })
console.log(`staging generado en dist-dev/ (noindex, ${r.count} páginas)`)
