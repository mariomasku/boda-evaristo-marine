import { translations } from './translations';
import { createI18n, type Lang } from './engine';

export type { Lang };

const { t, tn, getCurrentLang, applyLang, initI18n } = createI18n(translations);

export { t, tn, getCurrentLang, applyLang };

initI18n();
