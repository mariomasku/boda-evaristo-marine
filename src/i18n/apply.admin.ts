import { translations } from './translations';
import { translationsAdmin } from './translations.admin';
import { createI18n, type Lang } from './engine';

export type { Lang };

/**
 * Solo lo importan las páginas privadas (`dashboard.astro`, `mesas.astro` y las
 * páginas nuevas del gestor de boda) — nunca `Layout.astro` ni ningún componente
 * público. Fusiona el diccionario público (para `common.*`, título, meta...) con el
 * privado, para que las páginas del panel puedan usar ambos con el mismo `t()`.
 */
const merged = {
  es: { ...translations.es, ...translationsAdmin.es },
  fr: { ...translations.fr, ...translationsAdmin.fr },
};

const { t, tn, getCurrentLang, applyLang, initI18n } = createI18n(merged);

export { t, tn, getCurrentLang, applyLang };

initI18n();
