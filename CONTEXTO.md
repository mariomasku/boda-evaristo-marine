# Contexto del proyecto — Boda Marine & Evaristo

> Documento de referencia para retomar el trabajo en cualquier momento.
> Ver NUEVA-BODA-SETUP.md para la receta general reutilizable en futuras bodas.

---

## 1. Resumen del proyecto

Web de boda para **Marine y Evaristo (José)**, con **dos días de celebración**:

- **Jueves 1 de octubre de 2026** — Fiesta de bienvenida (preboda), a orillas del Guadalquivir, Córdoba.
- **Viernes 2 de octubre de 2026** — Boda, ceremonia laica en **Finca El Capricho** (Alcolea, Córdoba). Mapa: https://maps.app.goo.gl/AXdcVG4tCo7STsLf6 (37.9409249, -4.662873).

La web es **multiidioma (español/francés)** con selector de bandera y detección automática del idioma del navegador — ver §4.

- **Tema de diseño**: Mint (paleta "hojas" + distribución de landing de una sola página — ver tabla de temas en `NUEVA-BODA-SETUP.md` §0)
- **URL de producción**: https://boda-evaristo-marine.vercel.app (sin dominio propio de momento)
- **Repositorio**: https://github.com/mariomasku/boda-evaristo-marine
- **Hosting**: Vercel (proyecto `boda-evaristo-marine`, cuenta mariomascu.recursos@gmail.com)
- **Deploy automático**: push a `main` → Vercel despliega. Si el webhook falla, `npx vercel --prod`.

Este proyecto se creó duplicando `boda-isabel-marcos` como plantilla (mismo stack, mismos componentes) y personalizando el contenido. Desde entonces ha recibido bastantes más cambios que la plantilla original (i18n, segundo día de preboda, ajustes responsive) — ver el resto de este documento.

---

## 2. Datos específicos de esta boda

| Dato | Valor |
|---|---|
| Novios | Marine y Evaristo José (se muestra como "Marine & Evaristo José" en Hero/navbar/footer/dashboard) |
| Preboda | Jueves 1 de octubre, 21:30–01:00h, fiesta de bienvenida en P.º de la Ribera, 1 · Centro, Córdoba (orillas del Guadalquivir) |
| Boda — salida de autocar | Viernes 2 de octubre, 18:00h, desde Puerta de Almodóvar, Córdoba |
| Boda — ceremonia | Viernes 2 de octubre, **ceremonia laica** 18:30–19:30h, Finca El Capricho. Oficiada por **Samuel Belaud y José Luis Arjona** |
| Boda — resto del día | Cóctel 20:00h · Cena 21:30h · autocares de vuelta 03:00h/06:00h (**horarios de vuelta ocultos temporalmente**, ver §5) · Fin de fiesta 06:00h |
| Fecha límite RSVP | 1 de septiembre de 2026 |
| Teléfono Marine | +33 6 66 00 00 00 |
| Teléfono Evaristo | +33 6 13 94 47 00 |
| Fotógrafo | No asignado — no hay tarjeta de contacto de fotógrafo en `RSVP.astro`; añadir si se contrata uno |
| Credenciales `/dashboard` | Usuarios: `pila`, `brandon`, `admin` — Contraseña: `021026` |
| Fotos de la pareja | `public/fotos/Foto01.webp` (escritorio) y `public/fotos/Foto01responsive.webp` (recorte vertical para móvil, ≤480px). Únicas fotos disponibles; sustituir/ampliar cuando lleguen más |

---

## 3. Agenda de dos días (preboda + boda)

Los novios pidieron añadir un día previo (llegada desde Francia) con una fiesta de bienvenida junto al Guadalquivir, además de precisar la agenda del día de la boda que antes era más genérica.

- **`src/components/Preboda.astro`** — sección nueva, independiente de `Details.astro`, con su propio: título/subtítulo, fecha, botón "Añadir a mi calendario" (`.ics` propio, evento 1 oct 21:30–01:00h), un único item de "timeline" (icono `fiesta.svg` + hora + descripción, sin la lista vertical completa que sí tiene el día de la boda) y su propio mapa "Cómo llegar".
- **`src/components/Details.astro`** (agenda del día de la boda) — actualizado con datos reales: salida de autocar 18:00h desde Puerta de Almodóvar (con enlace a la ubicación), y ceremonia reetiquetada como "Ceremonia laica" 18:30–19:30h con los nombres de los oficiantes. El contador del Hero (`weddingDate`) y el `.ics` de la boda apuntan a las 18:30h (hora real de la ceremonia), no a las 19:00h originales de la plantilla.
- **Navbar**: el enlace "El día" pasa a llamarse **"Agenda"** (`nav.day` en `translations.ts`) y apunta a `#preboda` (la sección que aparece primero en la página), ya que ahora cubre los dos días.
- **`RSVP.astro`**: se añadió una **pregunta 2** ("¿Asistiréis a la fiesta de bienvenida del 1 de octubre?", Sí/No, obligatoria) *antes* de la pregunta de asistencia a la boda (que pasó a ser la 3). El resto de preguntas se renumeraron hasta la 12. El campo se llama `preboda_asistencia` en el formulario.
- **Backend (`api/rsvp.ts`)**: se añadió la columna **`PREBODA`** (columna N) al Google Sheet — el mismo valor Sí/No se escribe en todas las filas que genera un envío (invitado, acompañante, niños), igual que ya se hacía con `ASISTENCIA`. El `RESUMEN` tiene una fila nueva "Asisten a la fiesta de bienvenida (1 oct., SÍ)" dentro de la sección ASISTENCIA (esto desplazó en +1 todos los índices de fila usados por `SECTION_ROWS`/`SUBHEADER_ROWS`/el gráfico en `applyTheme()` — si se vuelve a tocar el layout del RESUMEN, cuidado con esos índices hardcodeados).
- **Backend (`api/stats.ts`)**: nuevo campo `asistencia.preboda` (conteo) y `asistencia.listaPreboda` (nombres), leyendo la columna N (`RSVP!A2:N`, antes era hasta `M`).
- **Dashboard**: la tarjeta que antes era "No asisten" ahora es **"Preboda"** (`dashboard.catPreboda`) y muestra cuántos/quiénes van a la fiesta de bienvenida, en vez de quién no va a la boda. El dato de "no asisten" se sigue calculando en `stats.ts` (`asistencia.noAsisten`) y en el RESUMEN del Sheet, solo se dejó de mostrar en el panel.
- Todo lo anterior está traducido también al francés en `translations.ts`.

---

## 4. Internacionalización (i18n) — español / francés

Esta boda se construyó primero solo en español; el francés se añadió **a posteriori** a petición de los novios (Marine es francesa). Costó más trabajo que si se hubiera planteado desde el principio, así que **NUEVA-BODA-SETUP.md §7 ya recoge esto como pregunta obligatoria** para la próxima boda.

Arquitectura implementada (reutilizable tal cual para futuras bodas multiidioma):

- `src/i18n/translations.ts` — diccionario `{ es: {...}, fr: {...} }` con todo el texto de la web, organizado por componente.
- `src/i18n/apply.ts` — motor: detecta idioma (`localStorage` → si no hay, `navigator.language`), aplica traducciones vía atributos `data-i18n` / `data-i18n-html` / `data-i18n-placeholder` / `data-i18n-aria` / `data-i18n-title`, y dispara un evento `langchange` para que el contenido generado por JS se regenere sin recargar.
- `src/components/LanguageSwitcher.astro` — banderas 🇪🇸/🇫🇷 en la navbar (`index.astro`) y en el header del dashboard. Solo se muestra la bandera del idioma **contrario** al activo (nunca las dos a la vez), sin borde, en su propia fila bajo el nav.
- `src/pages/api/stats.ts` devuelve una `key` estable (`gluten`, `whisky`, etc.) junto al nombre en español para cada alérgeno/bebida, para que `dashboard.astro` los traduzca sin tocar el Sheet.
- Los `value` de los campos del formulario RSVP se mantienen siempre en español (son los que lee `rsvp.ts`/`stats.ts`); solo se traduce la etiqueta visible.

Contenido con JS dinámico que ya está traducido (punto que más se olvida al añadir i18n): campos de niños e intolerancias en `RSVP.astro`, generación de los `.ics` en `Details.astro` y `Preboda.astro`, y todas las listas/categorías de `dashboard.astro`.

---

## 5. Ajustes responsive (móvil) — cosas a tener en cuenta

Varios elementos de la plantilla original no estaban pensados para nombres largos ("Marine & Evaristo José" es más largo que "Isabel & Marcos") ni para pantallas muy estrechas. Ajustes hechos:

- **Navbar**: nombre y enlaces se apilan en columna en ≤480px (antes competían por espacio en una sola fila y se veían rotos). La bandera del selector de idioma vive en su propia fila bajo el nav, no dentro de `.nav-links`.
- **Nombre del Hero**: el SVG animado (trazo dibujado a mano) se desbordaba en móvil con el nombre completo. Se añadió `.hero-names-mobile` — una versión apilada en HTML puro (Marine / & / Evaristo José) que solo se muestra en `@media (max-width: 480px)`; en escritorio se sigue viendo el SVG de siempre. Si se vuelve a tocar la tipografía del nombre, hay que editar **las dos versiones** (`#hero-name-text` en el SVG, y `.hero-names-mobile`/`.hnm-name`/`.hnm-amp` para móvil) porque son independientes.
- **Foto de fondo del Hero**: usa `public/fotos/Foto01responsive.webp` (recorte vertical) en ≤480px vía CSS custom properties `--bg`/`--bg-mobile`, controladas en `PhotoParallax.astro` (prop `fotoMobile`) y en `Hero.astro` directamente. Los 3 bloques `<PhotoParallax>` de `index.astro` también usan esta foto responsive.
  - **Ojo con `background-position` en `.hero-bg`**: dado que el contenedor está ampliado verticalmente respecto al viewport (para permitir el parallax al hacer scroll) y la imagen es más "ancha" que ese contenedor una vez escalada con `cover`, **`background-position` vertical no tiene ningún efecto real** — el cover siempre queda ajustado por altura, sin margen que mover. Para reencuadrar la foto verticalmente hay que tocar el `inset` del `.hero-bg` (asimétrico arriba/abajo) en vez de `background-position`. A fecha de este documento el `inset` está en `0% 0 0% 0` (sin expansión) tras varios ajustes manuales — revisar el valor actual en el código antes de asumir nada, porque se ha tocado más de una vez a ojo.
- **Mapas circulares**: `.map-wrapper`/`.map-label`/iframe **viven en `src/styles/global.css`**, no en `Details.astro` ni `Preboda.astro` — antes estaban duplicados en ambos componentes (cada uno con su propio scope de Astro vía `data-astro-cid-*`), así que cambiar uno no afectaba al otro aunque el código se viera idéntico. Ahora es una única fuente compartida; el círculo mide 330×330px en móvil. **No dupliques este bloque otra vez** si tocas el mapa de un componente — edítalo en `global.css`.

---

## 6. Estado temporal — horarios de autocar de vuelta ocultos

A petición de los novios, mientras no tengan el horario definitivo de los autocares de **vuelta** (Finca El Capricho → Córdoba):

- En `Details.astro` (agenda), los items de "Primer autocar" (03:00h) y "Segundo autocar" (06:00h) están **comentados** (no borrados) en el HTML, con una nota explicando por qué. La salida de **ida** (18:00h, Córdoba → Finca) se mantiene visible con toda su información.
- En `Bus.astro`, las dos tarjetas de vuelta y su encabezado ("Hay dos opciones de vuelta...") están comentadas igual. Se sustituyen por un aviso: "Horarios de vuelta por confirmar." / "Horaires de retour à confirmer." justo debajo de la tarjeta de ida (que sigue visible). Se quitó también el antetítulo "para los de Córdoba" (permanente, no temporal — el autobús es para todos, no solo para quien viene de Córdoba).
- **Para restaurarlos**: descomentar los bloques marcados en ambos ficheros con las horas/datos reales cuando los novios los confirmen, y volver a poner el intro/heading de `Bus.astro` a algo equivalente al original si ya no hace falta el aviso de "por confirmar".
- El resto de la web (RESUMEN del Sheet, dashboard, RSVP) sigue calculando/mostrando plazas de autobús con normalidad — lo único oculto son los horarios de vuelta en la web pública.

> **A fecha de este documento estos cambios (Bus.astro, Details.astro, translations.ts) están hechos en local pero sin commitear ni desplegar**, a petición explícita del usuario. Si retomas el trabajo, comprueba `git status` antes de asumir que ya están en producción.

---

## 7. Pendiente / a revisar

- [x] Google Sheet creado, `GOOGLE_SERVICE_ACCOUNT_KEY` y `GOOGLE_SHEET_ID` configurados en Vercel (Production/Preview/Development) y en `.env.local`
- [x] Repo de GitHub conectado a Vercel, deploy automático probado
- [x] RSVP probado de extremo a extremo (Sheet + `/dashboard`), incluida la columna `PREBODA`
- [ ] Confirmar horario de autocares de vuelta y restaurarlos (ver §6)
- [ ] Sustituir/ampliar fotos de la pareja cuando lleguen más (de momento solo `Foto01.webp`/`Foto01responsive.webp`)
- [ ] Fotógrafo: añadir tarjeta de contacto en `RSVP.astro` si finalmente se contrata uno
- [ ] Revisar si conviene comprar dominio propio (de momento solo `boda-evaristo-marine.vercel.app`)

Para el resto de detalles técnicos generales (stack, animaciones GSAP, problemas resueltos de la plantilla base), ver el documento CONTEXTO.md del proyecto plantilla `boda-isabel-marcos`: la arquitectura es la misma, salvo por todo lo descrito en este documento (i18n, segundo día de preboda, ajustes responsive) que `boda-isabel-marcos` no tiene.
