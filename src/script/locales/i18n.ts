/* eslint-disable import/no-named-as-default-member */
import i18next from 'i18next';
import * as enCommon from './en/commons.json';
import * as deCommon from './de/commons.json';

export const defaultNS = 'common'; // Default name space

i18next.init({
  lng: navigator.language, // Default language
  fallbackLng: 'en', // Fallback language
  debug: false, // Enable debug mode (optional)
  defaultNS: defaultNS,
  fallbackNS: defaultNS,
  resources: {
    en: {
      common: enCommon,
    },
    de: {
      common: deCommon,
    },
  },
});

export default i18next;