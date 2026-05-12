import { reactive, computed } from 'vue';
import enUS from '../locales/en-US.js';
import ptBR from '../locales/pt-BR.js';

// Auto-detect native language from browser, default to en-US if unidentifiable
function getDefaultLocale() {
  const navang = navigator.language || navigator.userLanguage;
  if (navang.includes('pt')) return 'pt-BR';
  return 'en-US';
}

const state = reactive({
  locale: getDefaultLocale(),
  currency: 'USD' // The user explicitly wanted BRL and USD supported, we can default locally or persist it
});

const messages = {
  'en-US': enUS,
  'pt-BR': ptBR
};

// Auto sync currency to initial language
if (state.locale === 'pt-BR') {
  state.currency = 'BRL';
}

export function useI18n() {
  const locale = computed(() => state.locale);
  const currency = computed(() => state.currency);

  function setLocale(l) {
    state.locale = l;
    localStorage.setItem('fp_locale', l);
    document.documentElement.lang = l;
  }

  function setCurrency(c) {
    state.currency = c;
    localStorage.setItem('fp_currency', c);
  }

  // Load from local storage if saved
  if (typeof localStorage !== 'undefined') {
    const savedL = localStorage.getItem('fp_locale');
    if (savedL) state.locale = savedL;
    const savedC = localStorage.getItem('fp_currency');
    if (savedC) state.currency = savedC;
  }
  
  // Sync HTML lang attribute to enforce local numeric input standard separators natively
  document.documentElement.lang = state.locale;

  function t(key, args = {}) {
    const keys = key.split('.');
    let str = keys.reduce((obj, k) => (obj || {})[k], messages[state.locale]);
    
    // Fallback exactly to English if a translation was stripped or missing
    if (!str) {
      str = keys.reduce((obj, k) => (obj || {})[k], messages['en-US']) || key;
    }

    // Advanced dynamic interpolator replacing string mapped elements
    for (const [k, v] of Object.entries(args)) {
      str = str.replace(`{${k}}`, v);
    }
    
    return str;
  }

  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    const maxVal = 999999999999999; // Strict ceiling cap under a quadrillion
    const clampedVal = Math.min(maxVal, num);
    return new Intl.NumberFormat(state.locale, {
      style: 'currency',
      currency: state.currency
    }).format(clampedVal);
  }

  return {
    locale,
    currency,
    setLocale,
    setCurrency,
    t,
    formatCurrency
  };
}
