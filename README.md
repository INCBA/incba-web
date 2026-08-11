# INCBA — sitio institucional

Sitio de nueve páginas. Se publica en **tres sitios** desde este único repo:

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

Trabajá en `dev`, mirá el resultado en test.incba.com.ar, y cuando esté bien hacé
merge a `master`.

Al hacer push a **`dev`**: el workflow `deploy-dev.yml` corre `tools/build-dev.mjs` y
publica en `INCBA/incba-web-dev`.

Al hacer push a **`master`**: GitHub Pages actualiza incba.com.ar, y `deploy-cl.yml`
corre `tools/build-cl.mjs` y publica la versión chilena en `INCBA/incba-web-cl`
(~20 segundos).

**No edites `INCBA/incba-web-cl` ni `INCBA/incba-web-dev` a mano.** Se sobrescriben
enteros en cada deploy.

## Cómo se edita

**Los `.html` de la raíz son generados. No los edites.** Se editan las fuentes de
`src/` y se regenera:

```bash
node tools/build.mjs --site=ar --out=.    # -> los 9 .html de la raíz + sitemap + robots
```

| Qué querés cambiar | Dónde |
|---|---|
| Texto de una sección | `src/sections/<nombre>.html` |
| Título, descripción o ruta de una página | `src/site.config.mjs` |
| Menú, pie o etiquetas del `<head>` | `src/partials/` |
| Diferencias entre incba.com.ar e incba.cl | `SITES` en `src/site.config.mjs` |

Las nueve rutas salen de `PAGES` en `src/site.config.mjs`. Cada página es un
`<slug>.html` en la raíz, que GitHub Pages sirve **sin barra final**
(`/servicios`, no `/servicios/`).

Para verlo local, con las URLs resueltas como las resuelve GitHub Pages:

```bash
node tools/build.mjs --site=ar          # -> dist-ar/
node tools/serve.mjs dist-ar            # -> http://localhost:8080
node tools/verify.mjs                   # rutas, meta tags y enlaces
```

`node tools/build-cl.mjs` y `node tools/build-dev.mjs` generan `dist-cl/` y
`dist-dev/`. Las tres carpetas están ignoradas por git.

### Agregar una página

1. Creá `src/sections/mi-pagina.html` con el contenido.
2. Agregá la entrada en `PAGES` de `src/site.config.mjs`, con `title`,
   `description`, `breadcrumb` y `sections`.
3. Regenerá. El menú, el sitemap, el hreflang y los breadcrumbs salen solos.

Para páginas por servicio el slug lleva barra —`servicios/arquitectura-api`— y el
routing ya lo resuelve.

### El staging no se indexa

`test.incba.com.ar` sale con `noindex, nofollow`, sin bloque `hreflang`, sin sitemap y
con `robots.txt` bloqueando todo. Es a propósito: un clon indexable de incba.com.ar le
competiría por las mismas búsquedas y se metería en el grupo hreflang AR/CL. La
canónica sigue apuntando a producción.

### Si el build falla

El generador valida antes de escribir y **no deja nada a medias**: si algo no da,
aborta sin tocar el disco y te dice qué. Lo que revisa:

- Título de más de 60 caracteres o descripción de más de 158 — son los puntos donde
  Google trunca.
- `title`, `description` o `canonical` repetido entre páginas. Un título duplicado es
  lo mismo que no tenerlo.
- Más o menos de una `<h1>` por página.
- Rutas de asset relativas, que se romperían en cuanto exista `/servicios/<slug>`.
- Enlaces a una `#ancla` que ya no está en esa página.
- **incba.cl:** que ninguna página tenga más de las tres referencias de hreflang a
  incba.com.ar. Sin ese chequeo, el dominio chileno se publicaría con la canónica
  apuntando a Argentina y Google dejaría de indexarlo.
- **staging:** que el `noindex` esté y que no haya quedado ninguna etiqueta hreflang.

El workflow `verificar.yml` corre todo eso en cada push, y además regenera el sitio
argentino y lo compara con lo commiteado. Si alguien editó un `.html` de la raíz a
mano, el CI lo marca.

### Las anclas viejas siguen funcionando

Los enlaces del sitio de una sola página (`/#servicios`, `/#resultados`…) ya circulan
y no se pueden romper. Un `#hash` no llega al servidor, así que la redirección se
resuelve en el cliente: un script inline en la home lee el hash y hace `replace` a la
ruta nueva. El mapa está en `ANCLAS_VIEJAS` de `src/site.config.mjs` y **se puede
retirar a partir de 2027-02-11**.

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
- Lo que cambia por dominio: `lang`, canónica, `og:url`, `og:locale`, país en los datos
  estructurados, el orden "Chile y Argentina" y el sitemap.
- **Los `<title>` hoy son iguales en los dos dominios**, salvo el de `/por-que-incba`,
  que lleva el orden de países. Los títulos vienen fijados por el brief de SEO y ninguno
  menciona país. La diferenciación queda a cargo del `hreflang` y de la canónica, que es
  suficiente, pero si en algún momento se quiere reforzar Chile alcanza con agregar un
  `title` propio por sitio en `PAGES`.

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
