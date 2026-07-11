# Contexto del proyecto — Boda Marine & Evaristo

> Documento de referencia para retomar el trabajo en cualquier momento.
> Ver NUEVA-BODA-SETUP.md para la receta general reutilizable en futuras bodas.

---

## 1. Resumen del proyecto

Web de boda para **Marine y Evaristo**, celebrada el **viernes 2 de octubre de 2026** en **Finca El Capricho** (Alcolea, Córdoba). Mapa: https://maps.app.goo.gl/AXdcVG4tCo7STsLf6 (37.9409249, -4.662873).

La web es **multiidioma (español/francés)** con selector de bandera y detección automática del idioma del navegador — ver §3.

- **URL de producción**: https://boda-evaristo-marine.vercel.app (sin dominio propio de momento)
- **Repositorio**: https://github.com/mariomasku/boda-evaristo-marine
- **Hosting**: Vercel (proyecto `boda-evaristo-marine`, cuenta mariomascu.recursos@gmail.com)
- **Deploy automático**: push a `main`/`master` → Vercel despliega. Si el webhook falla, `npx vercel --prod`.

Este proyecto se creó duplicando `boda-isabel-marcos` como plantilla (mismo stack, mismos componentes) y personalizando el contenido.

---

## 2. Datos específicos de esta boda

| Dato | Valor |
|---|---|
| Novios | Marine y Evaristo (José Evaristo) |
| Fecha | Viernes 2 de octubre de 2026, ceremonia 19:00h |
| Fecha límite RSVP | 1 de septiembre de 2026 |
| Lugar | Finca El Capricho, Alcolea (Córdoba) |
| Teléfono Marine | +33 6 66 00 00 00 |
| Teléfono Evaristo | +33 6 13 94 47 00 |
| Fotógrafo | No asignado — se quitó la tarjeta de contacto de fotógrafo en RSVP.astro; añadir si se contrata uno |
| Autobús | Ida 17:15h Córdoba → Finca El Capricho. Vuelta 03:00h y 06:00h Finca El Capricho → Córdoba |
| Credenciales `/dashboard` | Usuarios: `marine`, `evaristo`, `admin` — Contraseña: `021026` (cambiar antes de entrega si se desea) |
| Foto de la pareja | `public/fotos/Foto01.webp` (única foto disponible; se reutiliza en Hero y en las 3 secciones PhotoParallax de `index.astro`). Sustituir por más fotos cuando estén disponibles |

---

## 3. Internacionalización (i18n) — español / francés

Esta boda se construyó primero solo en español; el francés se añadió **a posteriori** a petición de los novios (Marine es francesa). Costó más trabajo que si se hubiera planteado desde el principio, así que **NUEVA-BODA-SETUP.md §7 ya recoge esto como pregunta obligatoria** para la próxima boda: preguntar desde el arranque si hace falta más de un idioma, para construirlo bien de entrada en vez de retrofitarlo.

Arquitectura implementada (reutilizable tal cual para futuras bodas multiidioma):

- `src/i18n/translations.ts` — diccionario `{ es: {...}, fr: {...} }` con todo el texto de la web, organizado por componente.
- `src/i18n/apply.ts` — motor: detecta idioma (`localStorage` → si no hay, `navigator.language`), aplica traducciones vía atributos `data-i18n` / `data-i18n-html` / `data-i18n-placeholder` / `data-i18n-aria` / `data-i18n-title`, y dispara un evento `langchange` para que el contenido generado por JS se regenere sin recargar.
- `src/components/LanguageSwitcher.astro` — banderas 🇪🇸/🇫🇷 en la navbar (`index.astro`) y en el header del dashboard.
- `src/pages/api/stats.ts` devuelve una `key` estable (`gluten`, `whisky`, etc.) junto al nombre en español para cada alérgeno/bebida, para que `dashboard.astro` los traduzca sin tocar el Sheet.
- Los `value` de los campos del formulario RSVP se mantienen siempre en español (son los que lee `rsvp.ts`/`stats.ts`); solo se traduce la etiqueta visible.

Contenido con JS dinámico que ya está traducido (punto que más se olvida al añadir i18n): campos de niños e intolerancias en `RSVP.astro`, generación del `.ics` en `Details.astro`, y todas las listas/categorías de `dashboard.astro`.

---

## 4. Pendiente de configurar (no lo puede hacer el agente por ti)

- [ ] Crear el Google Sheet de esta boda, compartirlo con `boda-rsvp@invibodas-masku.iam.gserviceaccount.com` como Editor, y copiar el Sheet ID
- [ ] Añadir `GOOGLE_SERVICE_ACCOUNT_KEY` y `GOOGLE_SHEET_ID` en Vercel (Settings → Environment Variables) y en `.env.local` local
- [ ] Conectar el repo de GitHub al proyecto de Vercel (o confirmar que ya está conectado)
- [ ] Sustituir la foto de plantilla por el resto de fotos reales cuando estén listas
- [ ] Revisar/echar un vistazo a las credenciales del panel privado antes de compartir el enlace con los novios

Para el resto de detalles técnicos (stack, componentes, animaciones GSAP, problemas resueltos), ver el documento CONTEXTO.md del proyecto plantilla `boda-isabel-marcos`: la arquitectura es la misma, salvo por la capa de internacionalización descrita en §3, que `boda-isabel-marcos` no tiene.
