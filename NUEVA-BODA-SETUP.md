# Plantilla de proyecto: web de boda con RSVP → Google Sheets

> **Propósito de este documento**: es la receta para levantar un proyecto **nuevo** (otra boda) igual que este, desde cero. Se centra en qué hay que conectar: repositorios, cuentas, APIs y servicios externos.
>
> Para el detalle técnico y el historial de la boda concreta de este repositorio, ver [`CONTEXTO.md`](./CONTEXTO.md).

---

## 0. Flujo de arranque — quién hace qué, y en qué orden

> Esta sección resume el flujo real de trabajo entre el humano y Claude Code para arrancar una boda nueva, en el orden correcto. El resto del documento (§1 en adelante) es el detalle técnico de cada paso; esta sección es el "orden de la receta".

### Atajo: la skill `/nueva-boda`

Todo el flujo de este §0 (preguntas + construcción + qué queda pendiente) está encapsulado en una **skill global de Claude Code**, instalada en `~/.agents/skills/nueva-boda/SKILL.md` (symlink en `~/.claude/skills/nueva-boda`, visible desde cualquier proyecto en este ordenador, no solo desde este repo).

**Cómo usarla la próxima vez**:
1. Completa primero los pasos 1–3 de "Antes de pedir nada a Claude Code" (abajo): repo en GitHub con este `.md`, proyecto de Vercel importado, Google Sheet creado y compartido.
2. Abre esa carpeta en VS Code con Claude Code, y escribe simplemente `/nueva-boda`.
3. La skill sigue este mismo orden de preguntas automáticamente: primero **qué tema/plantilla visual usar** (ver "Temas de diseño" más abajo — hasta ahora solo existe **Mint**, el de este proyecto), luego si tiene que ser multiidioma, y por último los datos de la boda (nombres, fecha, lugar, timeline, autobús, contactos, credenciales del panel, dominio, fotos).
4. No hace falta pegarle este documento a mano ni repetirle el proceso por chat: la skill ya sabe leer el `NUEVA-BODA-SETUP.md` del proyecto plantilla que elijáis para sacar el detalle técnico.

Si la skill no aparece disponible (por ejemplo, en otro ordenador), se puede seguir el mismo resultado pegando este documento completo en el chat y pidiendo a Claude Code que lo siga desde el principio — es exactamente lo que la skill automatiza.

### Temas de diseño (paleta + distribución)

Cada línea de diseño (colores + layout + tipografías) tiene un nombre propio, para poder tener varias plantillas distintas conviviendo y elegir cuál usar en cada boda nueva. Se registra con la línea **`Tema de diseño: <nombre>`** en el `CONTEXTO.md` de cada proyecto, para que la skill `/nueva-boda` pueda encontrarlas.

| Tema | Proyecto de referencia | Descripción |
|---|---|---|
| **Mint** | `boda-isabel-marcos` (origen) y `boda-evaristo-marine` (con i18n añadido) | Paleta "hojas" (dorado + verdes eucalipto/salvia sobre fondos marfil/crema, ver §6), tipografías Dancing Script/Playfair Display/Lato, layout de landing de una sola página con parallax, timeline vertical y panel `/dashboard` |

Cuando se cree un tema nuevo (otra paleta/otra distribución), añadir una fila aquí con su nombre y su proyecto de referencia, para que quede localizable.

### Antes de pedir nada a Claude Code (lo hace el humano)

1. **Crear el repositorio en GitHub** y subir este mismo fichero (`NUEVA-BODA-SETUP.md`) como único contenido inicial. Pegarlo como texto plano (crear fichero nuevo en GitHub y pegar el contenido, o arrastrar un `.md` real) — evitar subir un Word exportado a `.md`: llega como binario disfrazado de texto y hay que convertirlo a mano.
2. **Crear el proyecto en Vercel importando ese repo** desde el dashboard de Vercel (*Add New → Project → Import Git Repository*). Esto deja el webhook de auto-deploy ya conectado desde el principio. El primer deploy fallará porque el repo solo tiene el `.md` (no hay app todavía) — es normal, se arregla solo en cuanto Claude Code haga el primer push con el proyecto real.
3. **Crear el Google Sheet** de esta boda (vacío, cualquier nombre) y compartirlo con `boda-rsvp@invibodas-masku.iam.gserviceaccount.com` como Editor (ver §3.4). Este paso no bloquea el siguiente: se puede hacer en paralelo o incluso después.

### Pedir a Claude Code que construya el proyecto

4. Con este repo abierto en VS Code, pedirle a Claude Code que lea `NUEVA-BODA-SETUP.md` y construya el proyecto siguiendo la plantilla. Responder a sus preguntas: primero si la web debe ser **multiidioma** y en qué idiomas (§7 — pregunta obligatoria, decidirlo aquí y no después), y luego los datos de la boda (nombres, fecha, lugar, autobús, teléfonos, credenciales del panel, dominio, fotos — ver §6). Claude Code duplicará el proyecto plantilla más reciente, personalizará el contenido, probará el build en local y hará el primer push.

### Terminar de configurar (después de que el proyecto ya esté construido y pusheado)

5. Pasarle a Claude Code el **Sheet ID** (de la URL del Sheet creado en el paso 3) para que configure `GOOGLE_SHEET_ID` en Vercel y en `.env.local`.
6. Autorizar a Claude Code a reutilizar `GOOGLE_SERVICE_ACCOUNT_KEY` desde el proyecto de la boda anterior (es la misma cuenta de servicio para todas las bodas, no hay que crear nada nuevo en Google Cloud), o pasárselo directamente.
7. Pedir una **prueba real del RSVP**: enviar una confirmación de prueba, comprobar que aparece en el Sheet y en `/dashboard`, y que se borre la fila de prueba antes de entregar.
8. Revisar antes de entregar: credenciales del panel privado, fotos definitivas, dominio (si se compra uno), y el checklist de seguridad (§10).

---

## 1. Qué es este proyecto

Una web de invitación de boda de una sola página (landing scroll) con:
- Hero con parallax, cuenta atrás y animación de texto
- Bienvenida con revelado de texto al hacer scroll
- Timeline del día + mapa + botón "añadir a calendario"
- Sección de autobús con horarios
- Formulario de confirmación (RSVP) que escribe en un Google Sheet
- Panel privado (`/dashboard`) con estadísticas en vivo para los novios, protegido con contraseña simple
- Footer con acceso al panel
- Opcionalmente, **multiidioma con selector de bandera** (ver §7) — hay que decidirlo *antes* de escribir el contenido

No hay backend propio ni base de datos: **Google Sheets hace de base de datos**, vía un endpoint serverless en Vercel.

---

## 2. Stack técnico (versiones usadas en este proyecto)

| Paquete | Versión | Para qué |
|---|---|---|
| `astro` | ^7.0.3 | Framework principal |
| `@astrojs/vercel` | ^11.0.2 | Adapter serverless para Vercel |
| `tailwindcss` + `@tailwindcss/vite` | ^4.3.2 | Utilidades CSS (uso puntual) |
| `gsap` | ^3.15.0 | Animaciones (ScrollTrigger, SplitText, TextPlugin, ScrambleTextPlugin) |
| `googleapis` | ^173.0.0 | Cliente oficial de Google Sheets API |
| Node.js | ≥ 22.12.0 (`engines` en package.json) | Runtime |

No hay ninguna librería de i18n en el stack: el sistema multiidioma (§7) es un motor propio en TypeScript vanilla, sin dependencias nuevas.

**Notas de Astro 7**:
- No existe `output: 'hybrid'` (se eliminó). Solo hace falta añadir el adapter de Vercel.
- Cualquier fichero en `src/pages/api/*.ts` necesita `export const prerender = false` para ejecutarse como función serverless en vez de prerenderizarse como estático.

---

## 3. Servicios externos que hay que conectar

### 3.1 GitHub — repositorio de código
- Un repo por boda (o se puede duplicar/clonar este como plantilla).
- Vercel se conecta a este repo para desplegar en cada push.

### 3.2 Vercel — hosting + funciones serverless
- Un **proyecto de Vercel por boda**, importado desde el repo de GitHub.
- Adapter ya configurado en `astro.config.mjs` (`@astrojs/vercel`), no requiere `vercel.json`.
- Deploy automático: push a `master` → Vercel construye y despliega.
  - Si el webhook GitHub→Vercel no dispara (ha pasado antes), forzar con `npx vercel --prod`.
- Dominio: se puede comprar/gestionar desde el propio dashboard de Vercel, o apuntar un dominio externo (cambiando nameservers o añadiendo el registro que Vercel indique en *Settings → Domains*).

### 3.3 Google Cloud Platform — cuenta de servicio (reutilizable)
Esta parte **no hay que repetirla en cada boda**: un único proyecto de Google Cloud y una única Service Account sirven para todas.

- **Proyecto GCP**: `invibodas-masku`
- **Service Account**: `boda-rsvp@invibodas-masku.iam.gserviceaccount.com`
- **API habilitada**: Google Sheets API
- **Credencial**: un fichero JSON de clave de la Service Account (se guarda de forma segura, nunca en el repo)
- **Scopes usados**:
  - `https://www.googleapis.com/auth/spreadsheets` (lectura/escritura, usado en `api/rsvp.ts`)
  - `https://www.googleapis.com/auth/spreadsheets.readonly` (solo lectura, usado en `api/stats.ts`)

### 3.4 Google Sheets — base de datos de cada boda (uno por proyecto)
Este sí es específico de cada boda:
1. Crear un Google Sheet nuevo (vacío, cualquier nombre).
2. Compartirlo con `boda-rsvp@invibodas-masku.iam.gserviceaccount.com` como **Editor**.
3. Compartirlo también con los novios (como Editor o Lector, a su gusto) para que puedan consultarlo directamente si quieren.
4. Copiar el **Sheet ID**: es la parte de la URL entre `/d/` y `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`ESTE_ES_EL_ID`**`/edit`

El código (`ensureSetup()` en `src/pages/api/rsvp.ts`) crea automáticamente, en el primer envío del formulario:
- La pestaña `RSVP` (cabeceras, filtro, congelar fila 1)
- La pestaña `RESUMEN` (fórmulas de estadísticas + gráfico + tema visual)

No hace falta preparar nada dentro del Sheet, solo crearlo vacío y compartirlo.

### 3.5 Google Fonts — sin cuenta
Las tipografías se cargan por `@import url(...)` en `src/styles/global.css` desde `fonts.googleapis.com`. No requiere cuenta ni configuración, solo construir bien la URL (ver §8).

---

## 4. Checklist para crear una boda nueva

- [ ] **Idioma(s) de la web** — *pregunta obligatoria antes de escribir contenido*: ¿la web tiene que mostrarse en más de un idioma (p. ej. porque uno de los dos novios no es hispanohablante, o hay invitados internacionales)? Si la respuesta es sí, construir el sistema de i18n desde el arranque (ver §7) en vez de traducir todo el contenido después — es mucho más barato hacerlo bien la primera vez.
- [ ] **GitHub**: crear repo nuevo (o duplicar este) y clonarlo en local
- [ ] **Google Sheet**: crear uno vacío, compartirlo con `boda-rsvp@invibodas-masku.iam.gserviceaccount.com` como Editor, copiar el Sheet ID
- [ ] **Vercel**: crear proyecto nuevo desde ese repo
- [ ] **Variables de entorno en Vercel** (Settings → Environment Variables): añadir `GOOGLE_SERVICE_ACCOUNT_KEY` y `GOOGLE_SHEET_ID` (ver §5)
- [ ] **`.env.local`** en local (para `astro dev`): las mismas dos variables, en un fichero que **nunca se commitea** (ya está en `.gitignore`)
- [ ] **Dominio** (opcional): comprar o apuntar uno en Vercel → Settings → Domains
- [ ] **Contenido**: sustituir todos los datos de la boda anterior (ver §6 — checklist de personalización), ya en el idioma o idiomas decididos en el primer punto
- [ ] **Fotos**: sustituir `public/fotos/*.webp` y ajustar referencias en `Hero.astro` / `PhotoParallax` en `index.astro`
- [ ] **Credenciales del panel privado**: cambiar usuarios/contraseña en `Footer.astro` y `dashboard.astro` (ver §6)
- [ ] Probar en local (`npx astro dev --background`), enviar un RSVP de prueba y comprobar que aparece en el Sheet y en `/dashboard`
- [ ] Deploy: push a `master` (o `npx vercel --prod` si el webhook no dispara)

---

## 5. Variables de entorno

| Variable | Qué es | De dónde sale |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Contenido **completo** del JSON de la Service Account (como string) | Se descarga una vez del proyecto GCP `invibodas-masku`; se reutiliza igual en todas las bodas |
| `GOOGLE_SHEET_ID` | ID del Google Sheet de esta boda | De la URL del Sheet creado en §3.4; **distinto en cada boda** |

**Dónde van**:
- **Vercel** (producción): Project Settings → Environment Variables
- **Local**: fichero `.env.local` en la raíz (nunca se sube a git — ya está en `.gitignore`)

**Cuidado con el formato de `GOOGLE_SERVICE_ACCOUNT_KEY`**:
- Tiene que ser el JSON **minificado en una sola línea**, sin comillas envolventes extra.
- Si se usa `npx vercel env pull .env.local` para traer las variables desde Vercel, a veces el JSON queda envuelto en comillas dobles adicionales que rompen el parseo (`dotenv` corta el valor en la primera comilla interna). Si pasa, hay que editar `.env.local` a mano y quitar esas comillas envolventes.
- El código ya hace `credentials.private_key.replace(/\\n/g, '\n')` para arreglar los saltos de línea escapados que añade Vercel al guardar la variable.

---

## 6. Qué personalizar en cada boda nueva

### Contenido específico de la pareja
| Dato | Dónde está |
|---|---|
| Nombres de la pareja | `Hero.astro` (SVG del nombre), `Footer.astro`, `Layout.astro` (title/meta), `dashboard.astro` |
| Fecha y hora de la boda | `Hero.astro` (`weddingDate` del countdown), `Details.astro`, `Layout.astro`, `Footer.astro`, `RSVP.astro` (mensaje de éxito) |
| Fecha límite de confirmación | `RSVP.astro` (texto "confirma tu asistencia antes del...") |
| Lugar de la celebración | `Hero.astro`, `Details.astro` (timeline + mapa embed + `.ics`), `dashboard.astro` |
| Teléfonos de contacto | `Footer.astro` (novios), `RSVP.astro` (fotógrafo, si lo hay) |
| Horarios/rutas de autobús | `Bus.astro` |
| Timeline del día (horas de ceremonia, cóctel, cena...) | `Details.astro` |
| Nombre del fotógrafo y su teléfono (si lo hay) | `RSVP.astro` (tarjeta al final del formulario) |
| Fichero `.ics` del calendario | Se genera dinámicamente en `Details.astro` (script `ICS`), solo hay que cambiar los datos del evento |

### Credenciales del panel privado (`/dashboard`)
- **`Footer.astro`**: objeto `USERS` (usuarios y contraseña del modal de acceso) y la clave `sessionStorage.setItem('boda_auth', 'boda031026')`.
- **`dashboard.astro`**: la misma clave debe coincidir en el `if (sessionStorage.getItem('boda_auth') !== 'boda031026')`.
- Cambiar **ambos** a la vez (usuarios/contraseña + el "token" compartido), o el acceso se rompe.
- Nota de seguridad: es una protección simbólica en el cliente (sessionStorage), pensada para disuadir accesos casuales de invitados, **no** es un sistema de autenticación real. Suficiente para uso familiar, no para datos sensibles.

### Assets visuales
- `public/fotos/*.webp` → fotos de la pareja (Hero + bloques de parallax)
- `public/icons/*.svg` → iconos del timeline (se pueden reutilizar tal cual, son genéricos)
- `public/favicon.ico`
- `public/img/*` → ornamentos/patrones florales usados puntualmente

### Diseño — tema **Mint** (opcional cambiarlo — el sistema ya es reutilizable tal cual)
Esta paleta + distribución es el tema **Mint** (ver tabla de "Temas de diseño" en §0). Toda la paleta vive en **una única fuente de verdad**: `src/styles/global.css` (`:root`). El `dashboard.astro` importa este mismo fichero, así que cambiar un color ahí lo cambia en toda la web y en el panel a la vez.

Si una boda nueva quiere un tema distinto (otra paleta, otra distribución de secciones), no hace falta forzarlo dentro de Mint: se puede crear un tema nuevo con su propio nombre, documentarlo en la tabla de §0 y usar ese proyecto como referencia en adelante — la skill `/nueva-boda` pregunta qué tema usar precisamente por esto.

```css
/* src/styles/global.css — paleta actual ("hojas") */
--marfil / --crema / --blanco       /* fondos claros */
--oro / --oro-claro                 /* acento dorado */
--salvia / --eucalipto / --eucalipto-medio
--eucalipto-oscuro / --eucalipto-noche / --sombra   /* verdes, de claro a oscuro */
--menta / --oliva / --khaki          /* tonos suaves de apoyo */
--salvia-invitado / --salvia-acompanante / --salvia-ninos  /* colores de fila en el Google Sheet */
```

Si la boda siguiente quiere otra paleta, basta con cambiar los valores hex de estas variables (y, aparte, los colores del Sheet en `src/pages/api/rsvp.ts` — ver nota en §8, porque ahí no se pueden leer variables CSS).

**Tipografías** (import en la primera línea de `global.css`): Dancing Script, Birthstone Bounce, Playfair Display, Lato. (`WindSong` está importada pero sin uso actual — se puede quitar del `@import` si no se necesita, o aprovechar para otra parte del texto).

---

## 7. Internacionalización (i18n) — decidir desde el principio

> **Pregunta obligatoria al arrancar un proyecto nuevo**: ¿la web tiene que ser multiidioma? Si sí, seguir este patrón desde el primer commit de contenido, no después.
>
> La boda Marine & Evaristo se construyó primero solo en español y se le añadió francés más tarde a petición de los novios. Funcionó bien, pero costó bastante más trabajo que si se hubiera planteado así desde el principio: hubo que revisar componente a componente, incluidos los que generan HTML por JavaScript (formulario RSVP, dashboard, `.ics`). Por eso esta sección existe: para que la próxima vez se pregunte primero y se construya bien de entrada.

### Arquitectura (probada en boda-evaristo-marine, reutilizable tal cual)

Sistema de traducción 100% en cliente, sin librería externa (no el i18n de Astro, no `astro-i18next` — simplifica mucho no tener que generar rutas `/es/` y `/fr/` para una landing de una sola página):

- **`src/i18n/translations.ts`** — diccionario plano `{ es: {...}, fr: {...} }`, organizado por sección/componente (`hero.*`, `details.*`, `bus.*`, `rsvp.*`, `footer.*`, `dashboard.*`...). Para una boda nueva: duplicar el bloque de un idioma como base y traducir al resto de idiomas que hagan falta.
- **`src/i18n/apply.ts`** — motor de aplicación:
  - `detectInitialLang()`: mira `localStorage` primero; si no hay preferencia guardada, usa `navigator.language`.
  - `applyLang(lang)`: recorre el DOM y sustituye texto en `[data-i18n]` (`textContent`), `[data-i18n-html]` (`innerHTML`, para textos con `<strong>`/`<br>` embebido), `[data-i18n-placeholder]`, `[data-i18n-aria]` y `[data-i18n-title]`. Actualiza también `document.title`, la meta description, `document.documentElement.lang`, y guarda la preferencia en `localStorage`.
  - Dispara un evento `langchange` en `window` para que el contenido generado por JavaScript (ver más abajo) se pueda regenerar en el idioma nuevo sin recargar la página.
  - `t(lang, key)` y `tn(lang, key, n)` (esta última sustituye un marcador `{n}` — útil para "1 persona" / "2 personas").
  - Se importa **una única vez, lo antes posible**: en el `<head>` de `Layout.astro` para las páginas que usan `Layout`, y al principio del `<script>` de páginas que no lo usan (como `dashboard.astro`, que monta su propio `<html>`). Importa antes de cualquier otro script para que el idioma correcto ya esté aplicado cuando otros scripts (p. ej. GSAP `SplitText`, que trocea el texto en palabras) lean el contenido del DOM.
- **`src/components/LanguageSwitcher.astro`** — un par de botones-bandera (`🇪🇸`/`🇫🇷`, o los idiomas que toquen) que llaman a `applyLang(lang)` al hacer clic y marcan el activo con `.lang-flag.active`. Se coloca en la navbar de `index.astro` y en el header de `dashboard.astro`.

### Qué hay que traducir, en la práctica

- **Contenido estático** (la mayoría de la web): añadir `data-i18n="seccion.clave"` al elemento, dejando el texto en el idioma por defecto como valor "de fallback" directamente en el HTML (por si el JS tarda o falla).
- **Contenido con HTML embebido** (ej. "confirma antes del `<strong>1 de septiembre</strong>`"): usar `data-i18n-html` en vez de `data-i18n`.
- **Contenido generado por JavaScript** (la parte que más se olvida, y la que más partido saca de plantearlo desde el principio):
  - Campos dinámicos del RSVP (niños, intolerancias): la función que genera el HTML debe llamar a `t(getCurrentLang(), 'clave')` en vez de escribir strings a pelo, y debe volver a ejecutarse en un listener de `langchange` para que lo ya renderizado también cambie de idioma sin recargar.
  - El fichero `.ics` generado al vuelo en `Details.astro` (asunto, ubicación, descripción, nombre de fichero).
  - El **dashboard**: los nombres de alérgenos/bebidas que vienen del Google Sheet a través de `api/stats.ts` **no se traducen en el backend** — el endpoint devuelve una `key` estable (`gluten`, `whisky`, etc.) además del nombre en el idioma original del Sheet, y es `dashboard.astro` quien decide qué texto mostrar según el idioma activo. Así no hay que tocar la hoja de cálculo ni la lógica de negocio para añadir idiomas nuevos.
  - Mensajes de validación/envío del formulario (botón "Enviando…", mensajes de error) también deben pasar por `t()`.
- **Lo que NO se traduce**:
  - Nombres propios de la pareja.
  - El `value` de los `<input>`/`<select>` del formulario RSVP: debe quedarse fijo en un único idioma (el que use `api/rsvp.ts`/`api/stats.ts` para comparar), sea cual sea el idioma mostrado al invitado — solo se traduce la etiqueta visible (`<span>`), nunca el `value` que se guarda en el Sheet. Esto evita tener que tocar el backend al añadir idiomas.
  - El lugar de la boda, salvo que tenga un exónimo conocido en el otro idioma (p. ej. Córdoba → Cordoue en francés), que sí merece la pena traducir.

### Checklist rápida al construir la web multiidioma desde el principio

- [ ] Crear `src/i18n/translations.ts` y `src/i18n/apply.ts` calcados de los de boda-evaristo-marine
- [ ] Crear `src/components/LanguageSwitcher.astro` y añadirlo a la navbar y al header del dashboard
- [ ] Importar `../i18n/apply` en `Layout.astro` (cuanto antes en el `<head>`) y en el `<script>` de `dashboard.astro`
- [ ] Ir componente a componente añadiendo `data-i18n`/`data-i18n-html`/`data-i18n-placeholder`/`data-i18n-aria`/`data-i18n-title` según el tipo de contenido
- [ ] Revisar cada `<script>` que genere HTML dinámicamente (RSVP, Details/ICS, dashboard) y usar `t()`/`tn()` en vez de strings fijos, con su listener de `langchange` para refrescar lo ya renderizado
- [ ] Añadir una `key` estable en `api/stats.ts` para cualquier lista que muestre nombres traducibles (alérgenos, bebidas...)
- [ ] Probar con capturas de pantalla en cada idioma, comprobando la consola sin errores, y probar también un cambio de idioma en caliente con el formulario a medio rellenar

---

## 8. Cómo funciona la integración con Google Sheets (resumen técnico)

### `src/pages/api/rsvp.ts` (POST, escritura)
- Recibe el JSON del formulario.
- `ensureSetup()`: en cada envío, crea las pestañas si no existen, **siempre** reescribe cabeceras (por si se han renombrado) y reescribe las fórmulas de `RESUMEN`.
- Cabeceras de la hoja `RSVP` (columnas A→M):
  `FECHA · NOMBRE · ROL · ACOMPAÑANTE DE · ASISTENCIA · EDAD · INTOLERANCIAS · OTROS ALERGENOS · BEBIDA · AUTOBÚS · PLAZAS BUS · CANCIÓN · COMENTARIOS`
- Cada envío puede generar **varias filas** (invitado + acompañante + niños), coloreadas según el rol con `--salvia-invitado` / `--salvia-acompanante` / `--salvia-ninos`.
- El coloreado y el formato de cabecera están **acotados a columnas concretas** (A:M en RSVP, A:B en RESUMEN) para no pintar la fila entera de la hoja.
- `autoResizeColumns()`: ajusta el ancho de columna al contenido tras cada envío.
- **Importante**: los colores en este fichero están escritos como RGB 0–1 (formato que exige la API de Sheets), no pueden ser `var(--...)`. Hay un helper `rgb('hexsinalmohadilla')` que traduce un hex a ese formato — si cambias la paleta de `global.css`, tienes que replicar el cambio aquí a mano.
- Fórmulas de `RESUMEN` en español (`;` como separador de argumentos, no `,`) porque el Sheet está en locale español.
- Los valores que se escriben en el Sheet (asistencia, autobús, etc.) son siempre los `value` fijos del formulario (ver §7 sobre qué no se traduce), independientemente del idioma en que el invitado haya visto la web.

### `src/pages/api/stats.ts` (GET, lectura, usado por `/dashboard`)
- Lee `RSVP!A2:M` y calcula en JavaScript (no en fórmulas) las estadísticas: confirmados, adultos, niños, no asisten, plazas de bus ida/vuelta, intolerancias con listado de personas, bebidas.
- Si la web es multiidioma, cada elemento traducible (alérgenos, bebidas) debe llevar además una `key` estable para que el dashboard la traduzca sin tocar este fichero (ver §7).
- Devuelve también `sheetUrl` (enlace directo al documento) construido a partir de `GOOGLE_SHEET_ID`.

---

## 9. Comandos útiles

```bash
# Desarrollo local (modo background, recomendado)
npx astro dev --background
npx astro dev stop
npx astro dev status
npx astro dev logs

# Build de comprobación
npx astro build

# Traer variables de entorno desde Vercel
npx vercel env pull .env.local

# Deploy manual (si el webhook GitHub→Vercel no dispara)
npx vercel --prod

# Ver deployments / logs
npx vercel ls
npx vercel logs <deployment-url> --since 1h
```

---

## 10. Seguridad — checklist antes de entregar cada boda

- [ ] `.env.local` y cualquier fichero con la clave del Service Account están en `.gitignore` (ya lo están: `.env*`)
- [ ] Nunca imprimir/loguear `private_key` en consola ni en respuestas de la API
- [ ] El campo `debug: msg` de la respuesta de error en `rsvp.ts` es útil en desarrollo — valorar quitarlo o reducirlo antes de entrega final si el debug expone detalles internos
- [ ] Cambiar las credenciales del panel privado (§6) — no dejar las de la boda anterior
- [ ] Confirmar que el Google Sheet está compartido solo con la Service Account y con la pareja (no público)

---

## 11. Referencias cruzadas

- Historial técnico y decisiones de la boda de este repositorio: [`CONTEXTO.md`](./CONTEXTO.md)
- Instrucciones de desarrollo del repo: [`CLAUDE.md`](./CLAUDE.md)
