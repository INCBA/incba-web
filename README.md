# INCBA - sitio institucional

Sitio de una sola página. Desde este repo salen dos dominios:

| Sitio | Fuente | Cómo se publica | Se sirve desde |
|---|---|---|---|
| incba.com.ar | `index.html` de `master` | Solo, con cada push a `master` | este repo, GitHub Pages |
| incba.cl | `_cl/index.html` + secciones comunes de `index.html` | **A mano**, con `deploy-cl.yml` (en pausa) | `INCBA/incba-web-cl`, GitHub Pages |

## Flujo de trabajo

Trabaja en una rama desde `master` y abre un PR. El merge a `master` publica
incba.com.ar; incba.cl no cambia hasta que alguien corre `deploy-cl.yml`.

El repo es público y GitHub Pages publica todo lo que se commitea. Agrega los
archivos por nombre (`git add index.html css/opcion-b.css`), nunca con
`git add -A` ni `git add .`.

La rama `dev` tiene el sitio multipágina anterior. **No la mergees a `master`**:
su `deploy-cl.yml` se dispara con cada push a `master` y publicaría incba.cl sin
la verificación de Meta ni el WhatsApp chileno. test.incba.com.ar (`deploy-dev.yml`)
sólo se publica con push a `dev`, así que hoy muestra ese sitio anterior.

## incba.cl

La portada chilena es `_cl/index.html`. Tiene su propio `<head>`, su hero y su
historia. Las secciones que comparte con incba.com.ar llevan un marcador:

```html
<!-- incluir:servicios -->
```

`tools/build-cl.mjs` pone ahí la `<section id="servicios">` de `index.html` y,
sólo en lo incluido, cambia los CTA de WhatsApp y el correo por los de Chile.
Así, lo que se edita en `index.html` dentro de una sección común llega solo a
incba.cl en el próximo deploy. La barra, el pie y el flotante no son `<section>`:
se mantienen a mano en los dos archivos.

La carpeta empieza con `_` porque Jekyll excluye esas carpetas: así
`incba.com.ar/_cl/index.html` da 404.

### Build

```bash
node tools/build-cl.mjs    # -> dist-cl/
python3 -m http.server 8080 -d dist-cl
```

Antes de escribir `dist-cl/`, el build valida la salida: `lang="es-CL"`, canónica
propia, hreflang idéntico al de `index.html`, la metaetiqueta de Meta, ningún
WhatsApp ni correo argentino, JSON-LD de Chile, la guarda del píxel, los scripts
del `<head>` iguales a los de AR, la estructura de la historia (9 capítulos,
5 pasos, el chat primero) y que existan los assets. Si algo falla, sale con
error, dice qué invariante se rompió y no toca `dist-cl/`.

Si cambias `css/opcion-b.css`, `js/opcion-b.js` o el `<head>` de `index.html`,
corre también el build de incba.cl: los dos sitios comparten esos archivos.

### Publicar

El disparo por push está en pausa desde el 25-09-2026: incba.cl sigue con la
portada anterior hasta que la versión chilena esté aprobada.

```bash
gh workflow run deploy-cl.yml -R INCBA/incba-web --ref master
gh run watch
```

**No edites `INCBA/incba-web-cl` a mano.** El workflow lo sobrescribe entero.

Para volver a la portada anterior:
`gh workflow run deploy-cl.yml -R INCBA/incba-web --ref sitio-anterior-2026-09-25`.

## Por qué dos repos

GitHub Pages admite **un solo dominio propio por sitio**: responde 404 a cualquier
`Host` que no coincida con el archivo `CNAME`. Por eso incba.cl necesita su propio repo.

## SEO de los dos dominios

No hay penalización por contenido repetido entre dominios de país; Google lo contempla
explícitamente. Lo que sí importa:

- **Cada dominio se canonicaliza a sí mismo.** Si incba.cl apuntara su canónica a
  incba.com.ar, dejaría de posicionar en Chile.
- **El bloque `hreflang` es idéntico en ambos y cada página se incluye a sí misma.**
  Google exige que las referencias sean recíprocas: si una no apunta de vuelta,
  descarta el grupo entero y deja de mostrar el dominio correcto por país.
- Lo que cambia por dominio: `lang`, canónica, `og:url`, `og:locale`, país en los
  datos estructurados, la metaetiqueta de Meta (sólo incba.cl) y el sitemap.

Puede pasar que Search Console marque uno de los dos como "duplicado, Google eligió
otra canónica". Con contenido casi igual en el mismo idioma es esperable y no impide
que a los usuarios chilenos se les muestre incba.cl. Lo que más ayuda a separarlos es
diferenciar de verdad: teléfono chileno, dirección local, clientes o casos de Chile.

## DNS: no activar el proxy de Cloudflare

Los registros de ambos dominios apuntan a las IPs de GitHub Pages
(`185.199.108-111.153`) y **tienen que quedar en "DNS only" (nube gris)**.

Con el proxy activado (nube naranja), Cloudflare publica sus propias IPs; GitHub
detecta una IP que no es suya y deja de emitir y **de renovar** el certificado HTTPS.
El sitio queda sin HTTPS válido cuando vence el certificado.
