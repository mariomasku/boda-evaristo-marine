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
- Formulario de confirmación (RSVP) que escribe en un Google Sheet, con campo de correo electrónico
  y comprobación de duplicados para evitar confirmaciones repetidas del mismo invitado (ver §7ter y
  [`FUNCIONALIDAD-EMAIL-RSVP.md`](./FUNCIONALIDAD-EMAIL-RSVP.md))
- Panel privado (`/dashboard`) con estadísticas en vivo para los novios, protegido con contraseña simple
- Página privada **`/mesas`** (accesible desde el panel) para organizar el *seating*: asignar invitados a mesas, con mesa nupcial aparte, nombres de mesa, buscador y edición (ver §7bis y [`FUNCIONALIDAD-MESAS.md`](./FUNCIONALIDAD-MESAS.md))
- **Gestor de boda** (menú hamburguesa off-canvas desde el panel privado) con 15 categorías de
  planificación tipo "lista de tarjetas" (tareas, coordinación, planificación del día, música,
  regalos y 10 proveedores) sobre el mismo Google Sheet (ver §7quater y
  [`FUNCIONALIDAD-GESTOR-BODA.md`](./FUNCIONALIDAD-GESTOR-BODA.md))
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

**Nota de GSAP / ScrollTrigger — bug de iOS Safari (salto de scroll al top)**:
- **Síntoma**: en iPhone (Safari), la página "salta" bruscamente hacia arriba al hacer scroll, o al
  enviar un formulario (cualquier acción que cierre el teclado, ej. el RSVP). No se reproduce en
  otros navegadores/dispositivos.
- **Causa**: en iOS, la barra de direcciones y el teclado aparecen/desaparecen cambiando la altura
  del viewport, lo que dispara eventos `resize`. Por defecto, `ScrollTrigger` reacciona a esos
  eventos recalculando (`refresh()`) las posiciones de inicio/fin de **todos** los triggers activos
  (parallax, fades en scroll, etc.), y ese recálculo a mitad de scroll es lo que provoca el salto.
  Cuantos más triggers `scrub`/`ScrollTrigger.create` haya en la página (parallax de fotos, fades de
  `.gsap-fade`, timeline...), más notorio es el efecto.
- **Fix** (aplicarlo desde el primer commit de animaciones, no esperar a que aparezca el bug):
  justo después de cada `gsap.registerPlugin(ScrollTrigger, ...)`, añadir:
  ```ts
  ScrollTrigger.config({ ignoreMobileResize: true });
  ```
  Esto hace que ScrollTrigger ignore los `resize` causados solo por el cambio de altura del viewport
  (barra de direcciones/teclado), sin afectar a los recálculos legítimos por cambios reales de
  contenido/layout. Repetirlo en cada fichero `.astro` que registre `ScrollTrigger` de forma
  independiente (es idempotente, no hay problema en llamarlo varias veces).
- Si el salto persistiera incluso con este fix (caso raro), la siguiente escalada es
  `ScrollTrigger.normalizeScroll(true)` — más agresivo, unifica el scroll bajo JS y resuelve casi
  cualquier bug de scroll de iOS, pero cambia el comportamiento nativo del scroll en todo el sitio;
  probarlo primero en un dispositivo real antes de darlo por bueno.

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
- [ ] **Distribución de mesas (`/mesas`)**: copiar la funcionalidad de seating (ver §7bis y [`FUNCIONALIDAD-MESAS.md`](./FUNCIONALIDAD-MESAS.md)); solo hay que ajustar el token de auth y el nombre de la pareja
- [ ] **Email + anti-duplicados en el RSVP**: copiar el campo de email y la comprobación de duplicados (ver §7ter y [`FUNCIONALIDAD-EMAIL-RSVP.md`](./FUNCIONALIDAD-EMAIL-RSVP.md)); decidir primero si esa columna va dentro de `HEADERS` o aparte, según si la boda ya tiene `/mesas`
- [ ] **Gestor de boda** (menú off-canvas + categorías de planificación): copiar los ficheros de la plantilla genérica (ver §7quater y [`FUNCIONALIDAD-GESTOR-BODA.md`](./FUNCIONALIDAD-GESTOR-BODA.md)); requiere que el diccionario i18n ya esté separado en público/privado (§7)
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

- **`src/i18n/translations.ts`** — diccionario **público**, `{ es: {...}, fr: {...} }`, organizado por sección/componente (`hero.*`, `details.*`, `bus.*`, `rsvp.*`, `footer.*`...) — solo lo que ve un invitado en la web. Para una boda nueva: duplicar el bloque de un idioma como base y traducir al resto de idiomas que hagan falta.
- **`src/i18n/translations.admin.ts`** — diccionario **privado** (`dashboard.*`, `mesas.*`, y las secciones del gestor de boda si esa boda lo tiene — ver §7quater), con la misma forma `{ es: {...}, fr: {...} }`. Ningún fichero público lo importa.
- **`src/i18n/engine.ts`** — motor de aplicación compartido, parametrizado por diccionario (`createI18n(dict)`):
  - `detectInitialLang()`: mira `localStorage` primero; si no hay preferencia guardada, usa `navigator.language`.
  - `applyLang(lang)`: recorre el DOM y sustituye texto en `[data-i18n]` (`textContent`), `[data-i18n-html]` (`innerHTML`, para textos con `<strong>`/`<br>` embebido), `[data-i18n-placeholder]`, `[data-i18n-aria]` y `[data-i18n-title]`. Actualiza también `document.title`, la meta description, `document.documentElement.lang`, y guarda la preferencia en `localStorage`.
  - Dispara un evento `langchange` en `window` para que el contenido generado por JavaScript (ver más abajo) se pueda regenerar en el idioma nuevo sin recargar la página. También escucha un evento `lang-switch-request` (ver `LanguageSwitcher.astro` más abajo).
  - `t(lang, key)` y `tn(lang, key, n)` (esta última sustituye un marcador `{n}` — útil para "1 persona" / "2 personas").
- **`src/i18n/apply.ts`** — instancia pública: `createI18n(translations)` (solo el diccionario público) + `initI18n()` al importarse. Es la que importan `Layout.astro` y todos los componentes públicos (Hero, Welcome, Details, Bus, RSVP, Footer...).
- **`src/i18n/apply.admin.ts`** — instancia privada: fusiona `translations` (público, para `common.*`/título/meta) + `translations.admin` y expone el mismo `t`/`tn`/`getCurrentLang`/`applyLang`. Solo la importan `dashboard.astro`, `mesas.astro` y las páginas del gestor de boda.
  - Se importa **una única vez, lo antes posible**: en el `<head>` de `Layout.astro` (`apply.ts`) para las páginas que usan `Layout`, y al principio del `<script>` de páginas que no lo usan (como `dashboard.astro`, que monta su propio `<html>` e importa `apply.admin.ts`). Importa antes de cualquier otro script para que el idioma correcto ya esté aplicado cuando otros scripts (p. ej. GSAP `SplitText`, que trocea el texto en palabras) lean el contenido del DOM.
  - **Por qué está separado en dos diccionarios**: `translations.ts`/`apply.ts` es lo único que llega al bundle de la web pública (vía `Layout.astro`). Si el panel privado (dashboard, mesas, y sobre todo el gestor de boda de §7quater, que puede tener muchas más categorías) compartiera el mismo fichero, todo ese texto viajaría también a cada invitado aunque nunca vea esas pantallas. Mantenerlo separado desde el principio evita tener que hacer luego una migración — hacerlo quirúrgicamente sobre un proyecto ya grande cuesta más que empezar así.
- **`src/components/LanguageSwitcher.astro`** — un par de botones-bandera (`🇪🇸`/`🇫🇷`, o los idiomas que toquen) que se reutiliza tanto en páginas públicas como privadas. **No importa `apply`/`apply.admin` directamente** (si lo hiciera, siempre resolvería el mismo diccionario sin importar dónde se usa): al pulsar una bandera dispara `window.dispatchEvent(new CustomEvent('lang-switch-request', { detail: { lang } }))`, y es la instancia de i18n cargada en cada página (`apply.ts` o `apply.admin.ts`, cada una con su propio listener registrado en `initI18n()`) la que responde y aplica el cambio con su propio diccionario. Se coloca en la navbar de `index.astro`, en el header de `dashboard.astro`/`mesas.astro`, y en las páginas del gestor de boda.

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

- [ ] Crear `src/i18n/engine.ts`, `src/i18n/translations.ts` (público), `src/i18n/apply.ts` (público), `src/i18n/translations.admin.ts` (privado) y `src/i18n/apply.admin.ts` (privado) calcados de los de boda-evaristo-marine
- [ ] Crear `src/components/LanguageSwitcher.astro` (versión desacoplada por evento `lang-switch-request`, no por import directo) y añadirlo a la navbar y al header del dashboard/mesas
- [ ] Importar `../i18n/apply` en `Layout.astro` (cuanto antes en el `<head>`) y `../i18n/apply.admin` en el `<script>` de `dashboard.astro`/`mesas.astro`
- [ ] Ir componente a componente añadiendo `data-i18n`/`data-i18n-html`/`data-i18n-placeholder`/`data-i18n-aria`/`data-i18n-title` según el tipo de contenido
- [ ] Revisar cada `<script>` que genere HTML dinámicamente (RSVP, Details/ICS, dashboard) y usar `t()`/`tn()` en vez de strings fijos, con su listener de `langchange` para refrescar lo ya renderizado
- [ ] Añadir una `key` estable en `api/stats.ts` para cualquier lista que muestre nombres traducibles (alérgenos, bebidas...)
- [ ] Probar con capturas de pantalla en cada idioma, comprobando la consola sin errores, y probar también un cambio de idioma en caliente con el formulario a medio rellenar

---

## 7bis. Distribución de invitados por mesas (`/mesas`)

Herramienta de *seating* para los novios: una página privada **`/mesas`** (enlazada desde el panel
`/dashboard`) que permite asignar cada invitado confirmado a una mesa, con **mesa nupcial aparte**,
mesas numeradas desde la 1 con nombre temático opcional, buscador de invitados, y CRUD completo
(crear/editar/eliminar). Persiste en el propio Google Sheet: una columna nueva `MESA` en la pestaña
`RSVP` y una pestaña nueva `MESAS` para los nombres. **No toca `api/rsvp.ts` ni `api/stats.ts`**: es
una feature aislada y portable.

**El detalle completo (modelo de datos, endpoints, UI, i18n, cómo replicarla y cómo probarla) está en
un documento propio: [`FUNCIONALIDAD-MESAS.md`](./FUNCIONALIDAD-MESAS.md).**

Para una boda nueva, replicarla es copiar 2 ficheros y añadir traducciones:
1. Copiar `src/pages/api/mesas.ts` (tal cual — usa las mismas variables de entorno).
2. Copiar `src/pages/mesas.astro` y ajustar el **token de auth** del guard (`sessionStorage 'boda_auth'`,
   §6) y el nombre de la pareja del header.
3. Copiar la sección `mesas` de `translations.ts` a todos los idiomas + las claves
   `dashboard.sectionMesas` / `dashboard.verMesas`.
4. Añadir en `dashboard.astro` la sección de acceso a `/mesas`.
5. Nada que preparar en el Sheet: la columna `MESA` y la pestaña `MESAS` se crean solas la primera vez
   que se guarda una mesa.

> Si la web es multiidioma, esta funcionalidad también debe traducirse desde el principio (todos sus
> textos, incluidos los generados por JS, ya pasan por `t()`/`tn()` — encaja con la checklist de §7).

---

## 7ter. Email del invitado + comprobación de duplicados en el RSVP

Campo de **correo electrónico**, obligatorio, al final del formulario de RSVP (fuera del bloque
condicional de "asistes = Sí", así se pide siempre). Antes de guardar, el backend comprueba si ese
correo ya existe en la pestaña `RSVP` (sin distinguir mayúsculas ni espacios); si ya está registrado,
responde `409` y el formulario muestra "Ese correo ya ha sido registrado como invitado." bajo el
campo, sin escribir una fila nueva. Evita confirmaciones duplicadas del mismo invitado.

**El detalle completo (dónde va la columna EMAIL según si la boda tiene `/mesas` o no, backend,
frontend, i18n, cómo replicarla y cómo probarla) está en un documento propio:
[`FUNCIONALIDAD-EMAIL-RSVP.md`](./FUNCIONALIDAD-EMAIL-RSVP.md).**

Punto clave a decidir primero al replicarla: si esa boda **ya tiene** la funcionalidad de mesas
(§7bis), la columna `O` está ocupada por `MESA` y el email debe ir aparte en la columna `P` (patrón
idéntico al de `mesas.ts`, sin tocar `HEADERS`). Si **no** la tiene, `O` está libre y el email puede
añadirse directamente al array `HEADERS` de `rsvp.ts`, más simple.

---

## 7quater. Gestor de boda (menú off-canvas + categorías de planificación)

Convierte el panel privado en un gestor completo de la boda: un **menú hamburguesa off-canvas**
(enlazado desde la cabecera de `/dashboard`, `/mesas` y todas las páginas nuevas) da acceso a
**15 categorías de planificación** con UI en acordeón (tareas, coordinación, planificación del día,
música, regalos, y 10 proveedores: lugar, hotel, vestuario, peluquería, flores, tarta, catering,
fotógrafo, videógrafo, entretenimiento). Cada categoría es una pestaña nueva del **mismo** Google
Sheet del RSVP, creada sola la primera vez que se usa. Todas comparten una única plantilla genérica
(un fichero de configuración + un endpoint + una página dinámica) en vez de 15 implementaciones a
medida — añadir una categoría nueva es añadir una entrada a un array.

**Requisito previo**: el diccionario i18n de esa boda debe estar ya separado en público/privado
(§7) — si no, el gestor de boda acabaría descargándose también en la web pública de invitados.

**El detalle completo (modelo de datos, config, backend, frontend, menú, i18n, cómo replicarlo y
cómo probarlo) está en un documento propio:
[`FUNCIONALIDAD-GESTOR-BODA.md`](./FUNCIONALIDAD-GESTOR-BODA.md).**

Para una boda nueva, replicarlo es copiar 4 ficheros + añadir traducciones:
1. Copiar `src/lib/plannerConfig.ts` (o ajustar las categorías si esa boda quiere otras).
2. Copiar `src/pages/api/planner.ts` tal cual (usa las mismas variables de entorno).
3. Copiar `src/pages/planner/[id].astro` tal cual.
4. Copiar `src/components/AdminNav.astro` tal cual, y añadir `<AdminNav current="..." />` +
   `.dash-logo-wrap-group` en la cabecera de `dashboard.astro`/`mesas.astro`.
5. Copiar las secciones `plannerNav` y `planner` de `translations.admin.ts` a todos los idiomas.
6. Nada que preparar en el Sheet: las 15 pestañas se crean solas al primer uso de cada categoría.

**Queda fuera de esta plantilla** (ver el documento propio para el porqué): "Presupuesto" e
"Invitaciones" de la plantilla de Google original — no encajan en la forma de lista de tarjetas.

---

## 8. Cómo funciona la integración con Google Sheets (resumen técnico)

### `src/pages/api/rsvp.ts` (POST, escritura)
- Recibe el JSON del formulario.
- `ensureSetup()`: en cada envío, crea las pestañas si no existen, **siempre** reescribe cabeceras (por si se han renombrado) y reescribe las fórmulas de `RESUMEN`.
- Cabeceras de la hoja `RSVP` (columnas A→M):
  `FECHA · NOMBRE · ROL · ACOMPAÑANTE DE · ASISTENCIA · EDAD · INTOLERANCIAS · OTROS ALERGENOS · BEBIDA · AUTOBÚS · PLAZAS BUS · CANCIÓN · COMENTARIOS`
- Cada envío puede generar **varias filas** (invitado + acompañante + niños), coloreadas según el rol con `--salvia-invitado` / `--salvia-acompanante` / `--salvia-ninos`.
- El coloreado y el formato de cabecera están **acotados a columnas concretas** (A:M en RSVP, A:B en RESUMEN) para no pintar la fila entera de la hoja.
- `autoResizeColumns()`: ajusta el ancho de columna al contenido tras cada envío (como mínimo el
  ancho de la cabecera; crece si el contenido de la celda es más largo). Si la boda tiene columnas
  añadidas aparte de `HEADERS` (`MESA` de `/mesas`, `EMAIL` de este apartado), el límite de columnas
  para colorear y autoajustar debe ampliarse para cubrirlas también (ver `RSVP_TOTAL_COLS` en
  [`FUNCIONALIDAD-EMAIL-RSVP.md`](./FUNCIONALIDAD-EMAIL-RSVP.md)), si no se quedan sin colorear/ajustar.
- Comprueba duplicados por email antes de guardar (§7ter): detalle en
  [`FUNCIONALIDAD-EMAIL-RSVP.md`](./FUNCIONALIDAD-EMAIL-RSVP.md).
- **Importante**: los colores en este fichero están escritos como RGB 0–1 (formato que exige la API de Sheets), no pueden ser `var(--...)`. Hay un helper `rgb('hexsinalmohadilla')` que traduce un hex a ese formato — si cambias la paleta de `global.css`, tienes que replicar el cambio aquí a mano.
- Fórmulas de `RESUMEN` en español (`;` como separador de argumentos, no `,`) porque el Sheet está en locale español.
- Los valores que se escriben en el Sheet (asistencia, autobús, etc.) son siempre los `value` fijos del formulario (ver §7 sobre qué no se traduce), independientemente del idioma en que el invitado haya visto la web.

### `src/pages/api/stats.ts` (GET, lectura, usado por `/dashboard`)
- Lee `RSVP!A2:M` y calcula en JavaScript (no en fórmulas) las estadísticas: confirmados, adultos, niños, no asisten, plazas de bus ida/vuelta, intolerancias con listado de personas, bebidas.
- Si la web es multiidioma, cada elemento traducible (alérgenos, bebidas) debe llevar además una `key` estable para que el dashboard la traduzca sin tocar este fichero (ver §7).
- Devuelve también `sheetUrl` (enlace directo al documento) construido a partir de `GOOGLE_SHEET_ID`.

### `src/pages/api/mesas.ts` (GET/POST, usado por `/mesas`)
- Gestiona **aparte** la funcionalidad de seating (§7bis): la columna `MESA` de la pestaña `RSVP` y la
  pestaña `MESAS`. `rsvp.ts` y `stats.ts` no la conocen ni la tocan. Detalle en [`FUNCIONALIDAD-MESAS.md`](./FUNCIONALIDAD-MESAS.md).

### `src/pages/api/planner.ts` (GET/POST, usado por `/planner/[id]`)
- Un único endpoint genérico para las 15 categorías del gestor de boda (§7quater): cada categoría es
  una pestaña propia, creada de forma perezosa e idempotente a partir de `src/lib/plannerConfig.ts`.
  No toca `RSVP`, `RESUMEN` ni `MESAS`. Detalle en [`FUNCIONALIDAD-GESTOR-BODA.md`](./FUNCIONALIDAD-GESTOR-BODA.md).

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
- Funcionalidad de mesas (seating): [`FUNCIONALIDAD-MESAS.md`](./FUNCIONALIDAD-MESAS.md)
- Funcionalidad de email + anti-duplicados del RSVP: [`FUNCIONALIDAD-EMAIL-RSVP.md`](./FUNCIONALIDAD-EMAIL-RSVP.md)
- Gestor de boda (menú off-canvas + categorías de planificación): [`FUNCIONALIDAD-GESTOR-BODA.md`](./FUNCIONALIDAD-GESTOR-BODA.md)
