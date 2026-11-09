// SPDX-License-Identifier: AGPL-3.0-or-later
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/common.json";
import zh from "./locales/zh-CN/common.json";
import { initialPreference, resolveLocale } from "./locale";
export const resources = {
  en: { common: en },
  "zh-CN": { common: zh },
} as const;
export async function initializeLanguage() {
  const lng = resolveLocale(initialPreference(), navigator.languages);
  await i18n.use(initReactI18next).init({
    resources,
    lng,
    supportedLngs: ["en", "zh-CN"],
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  document.documentElement.lang = lng;
}
export { useTranslation } from "react-i18next";
export default i18n;
