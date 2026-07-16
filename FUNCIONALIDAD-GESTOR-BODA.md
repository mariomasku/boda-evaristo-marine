# Funcionalidad: Gestor de boda (menú off-canvas + categorías de planificación)

> **Propósito**: documentar de forma autocontenida el gestor de boda completo (menú
> hamburguesa off-canvas + 15 categorías de planificación tipo "lista de tarjetas")
> para poder **replicarlo en cualquier otra boda** que use esta plantilla.
> Implementado y probado por primera vez en `boda-evaristo-marine`.
>
> Para el resto de la arquitectura del proyecto ver [`NUEVA-BODA-SETUP.md`](./NUEVA-BODA-SETUP.md)
> y [`CONTEXTO.md`](./CONTEXTO.md). Para las otras dos features "hermanas" con las que
> comparte la pestaña `RSVP` ver [`FUNCIONALIDAD-MESAS.md`](./FUNCIONALIDAD-MESAS.md) y
> [`FUNCIONALIDAD-EMAIL-RSVP.md`](./FUNCIONALIDAD-EMAIL-RSVP.md).
>
> **Requisito previo**: esta feature asume que el diccionario i18n ya está separado en
> público/privado (`i18n/translations.ts` + `i18n/translations.admin.ts` + `i18n/engine.ts`
> + `i18n/apply.ts` + `i18n/apply.admin.ts`), para que el peso del gestor nunca llegue a
> la web de invitados. Si la boda destino todavía tiene un único `translations.ts`
> mezclado, hay que hacer esa separación primero — es un cambio de ~1-2h, aislado, y
> conviene hacerlo en su propio commit antes de portar esto (así se puede revertir solo
> si algo no encaja, sin perder el resto).

---

## 1. Qué hace

Convierte el panel privado (`/dashboard`) en un **gestor completo de la boda**, no solo
un panel de confirmaciones:

- **Menú hamburguesa off-canvas** en la cabecera de todas las páginas privadas: al
  pulsarlo se despliega un panel lateral con enlaces a `/dashboard`, `/mesas`, y las
  categorías de planificación, agrupadas en **"Organización"** (tareas, coordinación,
  planificación del día, música) y **"Proveedores"** (lugar, hotel, vestuario,
  peluquería, flores, tarta, catering, fotógrafo, videógrafo, entretenimiento, regalos).
- **15 categorías de planificación**, cada una una página con **tarjetas en acordeón**
  (mismo patrón visual que las intolerancias del formulario RSVP): se pulsa una tarjeta
  para desplegarla, se edita, se guarda o se elimina. Un botón "+ Añadir" crea una
  tarjeta en blanco.
- Todas las categorías comparten **una única plantilla genérica** (una página, un
  endpoint, un fichero de configuración) en vez de 15 implementaciones a medida:
  añadir una categoría nueva es añadir una entrada a un array de configuración + sus
  textos de traducción, nada de código nuevo.
- **Página de Presupuesto** (`/planner/presupuesto`): suma automáticamente los importes
  ya introducidos en cualquier categoría (cada campo marcado `isCost` en su
  configuración) y muestra un desglose por categoría + un total general — sin pestaña
  propia ni datos nuevos que mantener, es una vista de lo que ya se ha ido guardando
  (ver §7).
- **No duplica nada que ya exista**: la lista de invitados (ya cubierta por el RSVP) y
  la distribución de mesas (ya es `/mesas`) no se reconstruyen — el menú solo enlaza a
  las páginas que ya existen para esas dos.

---

## 2. Modelo de datos (en el Google Sheet)

Cada categoría = **una pestaña nueva en el mismo Sheet** que ya usan `RSVP`/`RESUMEN`/`MESAS`.
Se crean solas, de forma perezosa e idempotente, la primera vez que se visita esa
categoría (igual patrón que `ensureSetup()` de `rsvp.ts` y `ensureMesasSchema()` de
`mesas.ts`). Cabeceras = el `key` de cada campo en mayúsculas (guiones bajos → espacios).

| Categoría (id) | Pestaña | Campos |
|---|---|---|
| `tareas` | `TAREAS` | tarea*, fecha_limite, progreso (select), observaciones |
| `coordinacion` | `COORDINACION` | nombre*, rol, telefono, email, web, tarifa, observaciones |
| `planificacion` | `PLANIFICACION` | hora*, etapa*, observaciones |
| `musica` | `MUSICA` | momento (select), cancion*, artista, observaciones |
| `regalos` | `REGALOS` | nombre*, telefono, email, web, descripcion, cantidad, precio, observaciones |
| `lugar` | `LUGAR` | nombre*, contacto, telefono, email, web, direccion, capacidad, precio_salon, coste_persona, observaciones |
| `hotel` | `HOTEL` | nombre*, contacto, telefono, web, precio_habitacion, precio_suite, habitaciones_min, observaciones |
| `vestuario` | `VESTUARIO` | categoria*, nombre, telefono, email, web, arreglos (select), coste_total, observaciones |
| `peluqueria` | `PELUQUERIA` | nombre*, telefono, email, web, servicio (select), coste, observaciones |
| `flores` | `FLORES` | nombre*, telefono, email, web, elemento (select), coste_total, observaciones |
| `tarta` | `TARTA` | nombre*, telefono, email, web, precio_racion, coste_transporte, observaciones |
| `catering` | `CATERING` | nombre*, contacto, telefono, email, web, coste_persona, observaciones |
| `fotografo` | `FOTOGRAFO` | nombre*, telefono, email, web, coste_total, observaciones |
| `videografo` | `VIDEOGRAFO` | nombre*, telefono, email, web, tarifa, observaciones |
| `entretenimiento` | `ENTRETENIMIENTO` | nombre*, telefono, email, web, coste_estimado, horas, observaciones |

(`*` = campo obligatorio). Cada fila del Sheet se identifica por su **número de fila
real** (igual estrategia que `mesas.ts`: estable mientras no se borren filas a mano
fuera de la app).

Los campos de coste de cada categoría (`tarifa`, `precio_salon`, `coste_total`...) están
marcados `isCost: true` en `plannerConfig.ts` — es lo que lee la página de Presupuesto
(§7) para saber qué sumar, sin necesitar una pestaña ni una API propia.

**Aislamiento**: el endpoint `api/planner.ts` es dueño exclusivo de estas 15 pestañas.
No toca `RSVP`, `RESUMEN` ni `MESAS`, y viceversa — igual criterio que ya se sigue entre
`rsvp.ts` y `mesas.ts`.

---

## 3. Configuración — `src/lib/plannerConfig.ts`

**Fuente de verdad única** de las 15 categorías. No vive en `src/pages/` (Astro trataría
cualquier `.ts` ahí como una ruta/endpoint) sino en `src/lib/`.

```ts
export type FieldType = 'text' | 'tel' | 'email' | 'url' | 'number' | 'textarea' | 'select';

export interface FieldConfig {
  key: string;          // nombre de columna interno = cabecera del Sheet (en mayúsculas)
  type: FieldType;
  labelKey: string;      // clave i18n en planner.fieldLabels.<labelKey>
  options?: string[];    // para 'select': claves i18n en planner.options.<valor>
  required?: boolean;
  isCost?: boolean;      // si suma en /planner/presupuesto (ver §7)
}

export interface CategoryConfig {
  id: string;            // slug de ruta (/planner/<id>) y clave i18n (plannerNav.<id>)
  sheetTab: string;       // nombre de la pestaña en Sheets (MAYÚSCULAS, sin acentos)
  group: 'organizacion' | 'proveedores';  // grupo del menú off-canvas
  label: string;          // fallback ES antes de que aplique el JS de i18n
  fields: FieldConfig[];
}

export const CATEGORIES: CategoryConfig[] = [ /* 15 entradas, ver §2 */ ];
export function getCategory(id: string): CategoryConfig | undefined { ... }
export function getCostCategories(): CategoryConfig[] { ... }   // con algún campo isCost
export function getCostFields(cat: CategoryConfig): FieldConfig[] { ... }
```

**Añadir una categoría nueva = añadir una entrada a este array** + sus claves de
traducción (§7). Los campos con `labelKey`/`options` ya existentes (`nombre`,
`telefono`, `email`, `web`, `observaciones`, `coste_total`...) se reutilizan tal cual
entre categorías — solo hace falta añadir claves nuevas de traducción para las
etiquetas/opciones que de verdad sean nuevas.

---

## 4. Backend — `src/pages/api/planner.ts`

Un único endpoint (`export const prerender = false`) para las 15 categorías, mismo
patrón de auth que `rsvp.ts`/`mesas.ts` (Service Account desde
`GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_SHEET_ID`).

**`ensureCategorySheet(sheets, id, tab, fields)`** (idempotente, se llama en cada
GET/POST): crea la pestaña si no existe, (re)escribe la cabecera a partir de
`fields.map(key → MAYÚSCULAS)`, congela la fila 1 y le aplica el formato de cabecera
del tema (fondo `EUCALIPTO`, texto `OLIVA` en negrita) — igual estilo visual que el
resto de pestañas del Sheet.

**`GET ?cat=<id>`** → `{ ok, items: [{ row, values: {...} }] }`. Valida la categoría
contra `getCategory()`, asegura la pestaña, lee `A2:<últimaColumna>` y descarta filas
completamente vacías.

**`POST { cat, action, ... }`**:
- `action: "save"` con `{ values, row? }`: si `row` viene informado, `values.update` en
  esa fila (edición); si no, `values.append` (alta) y devuelve el número de fila real
  asignado (parseado de `updates.updatedRange`).
- `action: "delete"` con `{ row }`: `deleteDimension` real de esa fila (no dejar huecos).
- Errores → mensaje genérico al cliente, detalle solo en logs (mismo criterio que
  `rsvp.ts`/`mesas.ts`).

---

## 5. Frontend — `src/pages/planner/[id].astro`

**Una única página dinámica** (`getStaticPaths()` iterando `CATEGORIES`) genera las 15
páginas estáticas en build time. `prerender = true`, mismo patrón de auth por
`sessionStorage.getItem('boda_auth')` que `dashboard.astro`/`mesas.astro`.

- **Cabecera** idéntica a `dashboard.astro`/`mesas.astro` (`.dash-header`), con
  `<AdminNav current={cat.id} />` (ver §6) + `<LanguageSwitcher />`.
- **`+1pt de tamaño de letra`**: `html { font-size: 17px; }` en el `<style is:global>`
  de esta página (16px → 17px). Como el resto de medidas están en `rem`, esto escala
  proporcionalmente todo el gestor sin tocar `dashboard.astro`/`mesas.astro`, que
  mantienen su tamaño actual.
- **Config → cliente**: `<script define:vars={{ catId: cat.id, fields: cat.fields }}>`
  pasa la configuración de la categoría (calculada en build time) al script cliente
  vía `window.__PLANNER_CAT__`/`window.__PLANNER_FIELDS__` — así el mismo script
  genérico (`fetch` + render + acordeón) sirve para las 15 páginas sin duplicar lógica.
- **Tarjetas acordeón** (`cardHtml()`): cabecera con resumen (valor del primer campo) +
  chevron que rota al abrir; el panel interior renderiza un input por campo según su
  `type` (`text`/`tel`/`email`/`url`/`number` → `<input>`, `textarea` → `<textarea>`,
  `select` → `<select>` con las opciones traducidas). Solo una tarjeta abierta a la vez
  (delegación de eventos sobre `#planner-list`, se regenera con `innerHTML` en cada
  render — mismo patrón que las intolerancias del RSVP y las mesas de `/mesas`).
- **Guardar**: valida campos `required` (error inline en la tarjeta), hace `POST` a
  `/api/planner`, y actualiza el `row` local con el devuelto por el backend si era un
  alta nueva.
- **Eliminar**: si la tarjeta es una fila nueva sin guardar, se quita del DOM sin
  llamar a la API; si ya tiene `row`, pide confirmación (`confirm()`) y hace `POST
  action:"delete"`, reajustando en el cliente el `row` de las tarjetas posteriores
  (se desplazan una posición hacia arriba en el Sheet tras el `deleteDimension`).
- Un listener de `langchange` vuelve a renderizar con los datos ya cargados al cambiar
  de idioma (igual patrón que el resto de la web multiidioma).

---

## 6. Menú — `src/components/AdminNav.astro`

Componente compartido: renderiza **el botón hamburguesa** (para colocar en la cabecera,
junto al logo) **y el panel off-canvas** (overlay fijo, desliza desde la izquierda).

- Prop `current?: string` para resaltar el enlace activo.
- Deriva los enlaces de `CATEGORIES` agrupando por `.group` — **una sola fuente de
  verdad** con `plannerConfig.ts`, nada duplicado aquí.
- Enlaces fijos al principio: `/dashboard` ("Resumen") y `/mesas` ("Distribución de
  mesas") — no se reconstruyen esas páginas, solo se enlazan.
- Estilo: overlay oscuro con `backdrop-filter: blur()`, panel `--marfil` con cabecera
  `--eucalipto`/`--oro` (mismo lenguaje visual que el resto del panel privado).
- Se integra con **una sola línea** en la cabecera de cada página privada:
  ```astro
  <div class="dash-logo-wrap-group">
    <AdminNav current="dashboard" />
    <div class="dash-logo-wrap">...</div>
  </div>
  ```
  (`.dash-logo-wrap-group` es un simple `display:flex; align-items:center; gap:0.85rem;`
  añadido al `<style is:global>` de cada página que lo usa).

---

## 7. Presupuesto — `src/pages/planner/presupuesto.astro`

**No es una categoría más** (no tiene pestaña propia, no usa `planner/[id].astro`): es
una vista de solo lectura que agrega en el momento los importes ya guardados en las
demás categorías. Enlace fijo en el menú, junto a "Resumen"/"Distribución de mesas"
(fuera de los grupos "Organización"/"Proveedores", porque los agrega a ambos).

- **Sin backend nuevo**: en build time, `getCostCategories()` +
  `getCostFields()` (§3) calculan qué categorías tienen algún campo `isCost` y cuáles
  son, y se pasan al cliente vía `<script define:vars={{ costCategories }}>`.
- **Agregación 100% en cliente**: al cargar, hace un `fetch` en paralelo
  (`Promise.all`) a `/api/planner?cat=<id>` — el mismo endpoint genérico, sin tocarlo —
  por cada categoría con coste. Por cada fila, suma los valores de sus campos `isCost`
  (`parseFloat`, tolerando coma decimal) para el subtotal de esa categoría, y todos los
  subtotales para el total general.
- **UI**: mismas tarjetas acordeón que el resto del gestor — cabecera con el nombre de
  la categoría, nº de elementos con coste y su subtotal; el panel interior desglosa
  cada elemento con el nombre (primer campo) y el detalle de qué campos concretos
  suman ese importe (p. ej. "Precio del salón: 3.000 € · Coste por persona: 55 €"),
  más un enlace directo a `/planner/<id>` para editarlo. Formato de moneda con
  `Intl.NumberFormat` (`es-ES`/`fr-FR`, `EUR`).
- **Aviso de honestidad, no falsa precisión**: algunos campos son importes **por
  persona o por ración** (`coste_persona`, `precio_racion`...), no el gasto total de esa
  partida — el total general los suma tal cual, sin multiplicar por nº de invitados
  (esa lógica dependería de datos que el gestor no tiene por qué conocer con certeza en
  cada momento). La página muestra un aviso fijo explicándolo; es el humano quien
  interpreta esos números al leer el desglose.
- Recalcula todo también en el listener de `langchange` (igual patrón que el resto).

---

## 8. i18n — `src/i18n/translations.admin.ts`

Todo bajo el diccionario **privado** (nunca lo descarga la web pública — ver el
requisito previo al principio de este documento). Dos secciones nuevas, en cada idioma:

- **`plannerNav`**: `menuAria`, `closeAria`, `groupOrganizacion`, `groupProveedores`, y
  una clave por categoría (`tareas`, `coordinacion`, ..., `entretenimiento`) — se
  reutiliza tanto para las etiquetas del menú como para el `<h1>` de cada página.
- **`planner`**: strings genéricos de la UI (`add`, `save`, `cancel`, `delete`,
  `deleteConfirm`, `saving`, `saveError`, `loadError`, `loading`, `empty`,
  `backDashboard`) + dos diccionarios **planos y compartidos entre las 15 categorías**:
  - `fieldLabels.<labelKey>`: una entrada por cada campo *distinto* que aparece en
    cualquier categoría (~36 en total) — no un diccionario anidado por categoría, para
    no repetir "Nombre"/"Teléfono"/"Email"/"Observaciones" quince veces.
  - `options.<valor>`: labels de las opciones de los campos `select` (~15 en total),
    igual de compartido.

Este diseño plano es clave para que añadir una categoría nueva cueste poco: solo hace
falta traducir las claves de campo que sean genuinamente nuevas.

---

## 9. Cómo replicarlo en una boda nueva

1. **Comprobar el requisito previo**: el diccionario i18n debe estar ya separado en
   público/privado (ver la nota al principio de este documento). Si no lo está, hacerlo
   primero, en su propio commit.
2. Copiar `src/lib/plannerConfig.ts` tal cual (o ajustar las categorías si esa boda
   quiere menos/más, marcando `isCost: true` en los campos de importe de las nuevas).
3. Copiar `src/pages/api/planner.ts` tal cual (usa las mismas variables de entorno que
   `rsvp.ts`/`mesas.ts`, no depende de datos de la boda).
4. Copiar `src/pages/planner/[id].astro` y `src/pages/planner/presupuesto.astro` tal cual.
5. Copiar `src/components/AdminNav.astro` tal cual (deriva todo de `plannerConfig.ts`).
6. Añadir `<AdminNav current="..." />` + `.dash-logo-wrap-group` en la cabecera de
   `dashboard.astro` y `mesas.astro` de esa boda (ver el snippet de §6).
7. Copiar las secciones `plannerNav`, `planner` y `presupuesto` de `translations.admin.ts`
   a todos los idiomas de esa boda.
8. Nada que preparar a mano en el Google Sheet: las pestañas se crean solas la primera
   vez que se visita cada categoría; Presupuesto no tiene pestaña propia.

**Dependencias de la plantilla que deben existir**: el motor i18n dividido
(`i18n/engine.ts` + `i18n/apply.ts` + `i18n/apply.admin.ts`), `LanguageSwitcher.astro`
desacoplado por evento (`lang-switch-request`, ver `FUNCIONALIDAD-EMAIL-RSVP.md` si esa
boda todavía no lo tiene así), y el patrón de auth por `sessionStorage` del dashboard.

---

## 10. Verificación (cómo probarlo)

1. `npx astro build` sin errores — comprobar que las 15 rutas `/planner/<id>` y
   `/planner/presupuesto` aparecen en el listado de "prerendering static routes".
2. Local (`npx astro dev --background`) contra el Sheet real de esa boda (no suele
   haber uno de test separado):
   - Visitar cada categoría desde el menú off-canvas y comprobar que resalta la activa.
   - Probar alta + edición + borrado en al menos dos categorías de forma distinta (una
     sencilla, p. ej. `tareas`, y una con muchos campos, p. ej. `lugar`), comprobando
     en el Sheet que la pestaña se crea con la cabecera correcta y que las filas
     posteriores se recolocan bien tras un borrado.
   - Guardar un importe de prueba en 2-3 categorías con campos `isCost`, abrir
     `/planner/presupuesto` y comprobar que el desglose y el total suman correctamente
     (se puede replicar la misma suma con un script que llame a `/api/planner?cat=<id>`
     por cada categoría, para verificar el dato independientemente de la UI).
   - Comprobar que `/api/mesas` y `/api/rsvp` siguen funcionando igual (feature
     aislada, no debería afectarles).
   - Verificar que el chunk público de i18n no ha crecido (`grep` de algún texto del
     gestor en el chunk que carga `index.astro` — no debería aparecer).
3. Borrar las filas/pestañas de prueba del Sheet real antes de entregar.

---

## 11. Pendiente (no incluido en esta plantilla)

**"Invitaciones"** de la plantilla de Google original no encaja en la forma de "lista de
tarjetas" de este gestor ni en la de "agregación" de Presupuesto: es más una
calculadora de una sola fila (nº de invitaciones × tarjetas × programas con coste
unitario) que una lista de registros o un sumatorio de otras categorías.

Si se quiere añadir en el futuro, va como página a medida (no vía `plannerConfig.ts`),
reutilizando el mismo menú off-canvas y el mismo diccionario `translations.admin.ts`.

---

## 12. Ficheros

| Fichero | Cambio |
|---|---|
| `src/lib/plannerConfig.ts` | **Nuevo** — configuración de las categorías (fuente de verdad única), campos `isCost` |
| `src/pages/api/planner.ts` | **Nuevo** — endpoint genérico GET/POST para todas las categorías |
| `src/pages/planner/[id].astro` | **Nuevo** — página dinámica (UI acordeón + script cliente) |
| `src/pages/planner/presupuesto.astro` | **Nuevo** — vista de agregación de costes (sin pestaña propia) |
| `src/components/AdminNav.astro` | **Nuevo** — menú hamburguesa off-canvas |
| `src/i18n/translations.admin.ts` | Secciones `plannerNav`, `planner` y `presupuesto` (todos los idiomas) |
| `src/pages/dashboard.astro`, `src/pages/mesas.astro` | Integración de `<AdminNav />` en la cabecera |
| `api/rsvp.ts`, `api/mesas.ts`, `api/stats.ts` | **Sin cambios** (feature aislada) |
