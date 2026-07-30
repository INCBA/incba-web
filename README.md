# INCBA — sitio institucional

Sitio de una sola página que se publica en **dos dominios**:

| Dominio | Público | Se sirve desde |
|---|---|---|
| incba.com.ar | Argentina | este repo, GitHub Pages |
| incba.cl | Chile | `rebofel/incba-web-cl`, GitHub Pages |

## Cómo editar el contenido

Editá **`index.html` de este repo y nada más**. Al hacer push a `master`:

1. GitHub Pages actualiza incba.com.ar.
2. El workflow `.github/workflows/deploy-cl.yml` corre `tools/build-cl.mjs`, genera la
   versión chilena y la publica en `rebofel/incba-web-cl` (~20 segundos).

**No edites `rebofel/incba-web-cl` a mano.** Se sobrescribe entero en cada deploy.

Para probar la salida chilena antes de publicar:

```bash
node tools/build-cl.mjs
```

Queda en `dist-cl/` (ignorado por git).

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
