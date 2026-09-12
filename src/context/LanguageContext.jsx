import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("autoled_lang") || "fr";
  });

  useEffect(() => {
    localStorage.setItem("autoled_lang", lang);
    const root = document.documentElement;
    if (lang === "ar") {
      root.setAttribute("dir", "rtl");
      root.setAttribute("lang", "ar");
    } else {
      root.setAttribute("dir", "ltr");
      root.setAttribute("lang", "fr");
    }
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === "fr" ? "ar" : "fr"));
  };

  const isRtl = lang === "ar";
  const t = translations[lang] || translations.fr;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isRtl, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}