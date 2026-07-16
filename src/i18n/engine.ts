export type Lang = 'es' | 'fr';

const STORAGE_KEY = 'boda_lang';

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

/**
 * Motor de i18n parametrizado por diccionario. Cada página crea su propia instancia
 * (ver `apply.ts` para el público y `apply.admin.ts` para el panel privado) para que
 * el bundle público nunca incluya las traducciones exclusivas del panel privado.
 */
export function createI18n<D extends Record<Lang, Record<string, unknown>>>(dict: D) {
  let currentLang: Lang = 'es';

  function t(lang: Lang, key: string): string {
    const val = getByPath(dict[lang], key) ?? getByPath(dict.es, key);
    return (val as string | undefined) ?? key;
  }

  /** Traduce y sustituye el marcador {n} por el número dado. */
  function tn(lang: Lang, key: string, n: number): string {
    return t(lang, key).replace('{n}', String(n));
  }

  function getCurrentLang(): Lang {
    return currentLang;
  }

  function applyLang(lang: Lang) {
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

  function initI18n() {
    applyLang(detectInitialLang());
    // Desacopla LanguageSwitcher.astro (compartido entre la web pública y el panel
    // privado) de qué diccionario usa cada página: el switcher solo dispara este
    // evento, y la instancia de i18n cargada en cada página (pública o admin) responde.
    window.addEventListener('lang-switch-request', (e) => {
      applyLang((e as CustomEvent<{ lang: Lang }>).detail.lang);
    });
  }

  return { t, tn, getCurrentLang, applyLang, initI18n };
}
