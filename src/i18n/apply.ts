import { translations, type Lang } from './translations';

export type { Lang };

const STORAGE_KEY = 'boda_lang';
let currentLang: Lang = 'es';

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'fr') return saved;
  } catch {
    /* localStorage no disponible (modo privado, etc.) */
  }
  const nav = (navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || '').toLowerCase();
  return nav.startsWith('fr') ? 'fr' : 'es';
}

function getByPath(obj: unknown, path: string): string | undefined {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj) as string | undefined;
}

export function t(lang: Lang, key: string): string {
  const val = getByPath(translations[lang], key) ?? getByPath(translations.es, key);
  return val ?? key;
}

/** Traduce y sustituye el marcador {n} por el número dado. */
export function tn(lang: Lang, key: string, n: number): string {
  return t(lang, key).replace('{n}', String(n));
}

export function getCurrentLang(): Lang {
  return currentLang;
}

export function applyLang(lang: Lang) {
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang;

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(lang, key);
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (key) el.innerHTML = t(lang, key);
  });

  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(lang, key);
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(lang, key));
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.setAttribute('title', t(lang, key));
  });

  const titleKey = document.body?.dataset.titleKey || 'common.title';
  document.title = t(lang, titleKey);
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', t(lang, 'common.metaDescription'));

  // Solo se muestra la bandera del idioma AL QUE se puede cambiar
  // (el contrario al activo), nunca la del idioma ya activo.
  document.querySelectorAll<HTMLElement>('.lang-flag').forEach((el) => {
    const isCurrent = el.getAttribute('data-lang') === lang;
    el.style.display = isCurrent ? 'none' : '';
  });

  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function initI18n() {
  applyLang(detectInitialLang());
}

initI18n();
