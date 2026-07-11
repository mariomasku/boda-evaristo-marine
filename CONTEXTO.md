# Contexto del proyecto — Boda Marine & Evaristo

> Documento de referencia para retomar el trabajo en cualquier momento.
> Ver NUEVA-BODA-SETUP.md para la receta general reutilizable en futuras bodas.

---

## 1. Resumen del proyecto

Web de boda para **Marine y Evaristo**, celebrada el **viernes 2 de octubre de 2026** en **Finca El Capricho** (Alcolea, Córdoba). Mapa: https://maps.app.goo.gl/AXdcVG4tCo7STsLf6 (37.9409249, -4.662873).

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

## 3. Pendiente de configurar (no lo puede hacer el agente por ti)

- [ ] Crear el Google Sheet de esta boda, compartirlo con `boda-rsvp@invibodas-masku.iam.gserviceaccount.com` como Editor, y copiar el Sheet ID
- [ ] Añadir `GOOGLE_SERVICE_ACCOUNT_KEY` y `GOOGLE_SHEET_ID` en Vercel (Settings → Environment Variables) y en `.env.local` local
- [ ] Conectar el repo de GitHub al proyecto de Vercel (o confirmar que ya está conectado)
- [ ] Sustituir la foto de plantilla por el resto de fotos reales cuando estén listas
- [ ] Revisar/echar un vistazo a las credenciales del panel privado antes de compartir el enlace con los novios

Para el resto de detalles técnicos (stack, componentes, animaciones GSAP, problemas resueltos), ver el documento CONTEXTO.md del proyecto plantilla `boda-isabel-marcos`, ya que la arquitectura es idéntica.
