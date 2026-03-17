import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../constants/translations';
import { useAuth } from './AuthContext';

type Lang = 'en' | 'es';

type LanguageContextType = {
  lang: Lang;
  t: typeof translations.en;
  setLang: (l: Lang) => void;
};

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>('es');

  useEffect(() => {
    if (user?.language) setLang(user.language as Lang);
  }, [user?.language]);

  const t = translations[lang] || translations.es;

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
