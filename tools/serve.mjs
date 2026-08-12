/**
 * Servidor local para verificar el sitio como lo sirve GitHub Pages.
 *
 *   node tools/serve.mjs [dist-ar] [--port=8080]
 *
 * `python3 -m http.server` no sirve: no resuelve URLs sin extensión, así que
 * /servicios daría 404 y no reproduciría el comportamiento real. GitHub Pages
 * sí resuelve /servicios contra servicios.html, que es la forma de URL que
 * usan las canónicas del sitio.
 *
 * Es una herramienta de desarrollo. No se publica.
 */

import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, resolve, extname, dirname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const port = Number((args.find((a) => a.startsWith('--port=')) || '--port=8080').split('=')[1])
// resolve y no join: join('/repo', '/tmp/x') da '/repo/tmp/x' y rompe con
// cualquier ruta absoluta.
const base = resolve(ROOT, args.find((a) => !a.startsWith('--')) || 'dist-ar')

// Servir una carpeta que no existe devolvía 404 en todo, en silencio. Es un
// modo de fallo caro: en CI parece que el sitio está roto cuando lo que falta
// es el build.
if (!existsSync(base) || !statSync(base).isDirectory()) {
  console.error(`\nNo existe la carpeta ${base}.`)
  console.error('Generala antes:  node tools/build.mjs --site=ar\n')
  process.exit(1)
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

/** Mismo orden de resolución que GitHub Pages: el archivo tal cual, después
 *  con .html, y por último index.html si es un directorio. */
function resolver(urlPath) {
  const limpio = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  const candidatos = [
    join(base, limpio),
    join(base, `${limpio}.html`),
    join(base, limpio, 'index.html'),
  ]
  for (const c of candidatos) {
    if (!c.startsWith(base)) continue
    if (existsSync(c) && statSync(c).isFile()) return c
  }
  return null
}

createServer((req, res) => {
  const archivo = resolver(req.url === '/' ? '/index.html' : req.url)
  if (!archivo) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end(`404 — ${req.url}\n`)
    return
  }
  res.writeHead(200, { 'content-type': TIPOS[extname(archivo)] || 'application/octet-stream' })
  res.end(readFileSync(archivo))
}).listen(port, () => {
  console.log(`sirviendo ${base} en http://localhost:${port}`)
})
