# INCBA — sitio institucional

Sitio de una sola página. Se publica en **tres sitios** desde este único repo:

| Sitio | Rama | Público | Se sirve desde |
|---|---|---|---|
| incba.com.ar | `master` | Argentina | este repo, GitHub Pages |
| incba.cl | `master` | Chile | `INCBA/incba-web-cl`, GitHub Pages |
| test.incba.com.ar | `dev` | staging interno | `INCBA/incba-web-dev`, GitHub Pages |

## Flujo de trabajo

```
dev    ──push──>  test.incba.com.ar          (revisás acá)
 │
 └─merge a master──>  incba.com.ar + incba.cl   (producción)
```

Editá **`index.html` y nada más**. Trabajá en `dev`, mirá el resultado en
test.incba.com.ar, y cuando esté bien hacé merge a `master`.

Al hacer push a **`dev`**: el workflow `deploy-dev.yml` corre `tools/build-dev.mjs` y
publica en `INCBA/incba-web-dev`.

Al hacer push a **`master`**: GitHub Pages actualiza incba.com.ar, y `deploy-cl.yml`
corre `tools/build-cl.mjs` y publica la versión chilena en `INCBA/incba-web-cl`
(~20 segundos).

**No edites `INCBA/incba-web-cl` ni `INCBA/incba-web-dev` a mano.** Se sobrescriben
enteros en cada deploy.

### El staging no se indexa

`test.incba.com.ar` sale con `noindex, nofollow`, sin bloque `hreflang`, sin sitemap y
con `robots.txt` bloqueando todo. Es a propósito: un clon indexable de incba.com.ar le
competiría por las mismas búsquedas y se metería en el grupo hreflang AR/CL. La
canónica sigue apuntando a producción. Si tocás esas etiquetas en `index.html`, el
build de staging falla en vez de publicar algo indexable.

Para generar cualquiera de las dos salidas localmente:

```bash
node tools/build-cl.mjs    # -> dist-cl/
node tools/build-dev.mjs   # -> dist-dev/
```

Ambas carpetas están ignoradas por git.

### Si el build falla

`tools/build-cl.mjs` tiene una lista de reemplazos y **exige la cantidad exacta de
coincidencias de cada uno**. Si tocás una frase que el script busca (por ejemplo
"Argentina y Chile" o el `<title>`), el build falla y te dice cuál regla se rompió.

Es a propósito: sin esa verificación, incba.cl se publicaría con la etiqueta canónica
apuntando a incba.com.ar, y Google dejaría de indexar el dominio chileno. Cuando falle,
actualizá la regla en `RULES` y volvé a correrlo.

## Por qué dos repos

GitHub Pages admite **un solo dominio propio por sitio**: responde 404 a cualquier
`Host` que no coincida con el archivo `CNAME`. Por eso incba.cl necesita su propio repo.
El contenido no se duplica: sale siempre de `index.html` de acá.

## SEO de los dos dominios

No hay penalización por contenido repetido entre dominios de país; Google lo contempla
explícitamente. Lo que sí importa:

- **Cada dominio se canonicaliza a sí mismo.** Si incba.cl apuntara su canónica a
  incba.com.ar, dejaría de posicionar en Chile.
- **El bloque `hreflang` es idéntico en ambos y cada página se incluye a sí misma.**
  Google exige que las referencias sean recíprocas: si una no apunta de vuelta,
  descarta el grupo entero y deja de mostrar el dominio correcto por país.
- Lo que cambia por dominio: `lang`, `<title>`, canónica, `og:url`, `og:locale`,
  país en los datos estructurados, el orden "Chile y Argentina" y el sitemap.

Puede pasar que Search Console marque uno de los dos como "duplicado, Google eligió
otra canónica". Con contenido casi igual en el mismo idioma es esperable y no impide
que a los usuarios chilenos se les muestre incba.cl. Lo que más ayuda a separarlos es
diferenciar de verdad: teléfono chileno, dirección local, clientes o casos de Chile.

## DNS — no activar el proxy de Cloudflare

Los registros de ambos dominios apuntan a las IPs de GitHub Pages
(`185.199.108-111.153`) y **tienen que quedar en "DNS only" (nube gris)**.

Con el proxy activado (nube naranja), Cloudflare publica sus propias IPs; GitHub
detecta una IP que no es suya y deja de emitir y **de renovar** el certificado HTTPS.
El sitio queda sin HTTPS válido, no en el momento, sino cuando vence el certificado.
