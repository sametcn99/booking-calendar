import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";
import en from "../i18n/en.json";
import tr from "../i18n/tr.json";

type Language = "en" | "tr";
type NestedRecord = { [key: string]: string | NestedRecord };

const translations: Record<Language, NestedRecord> = { en, tr };

function resolve(obj: NestedRecord, key: string): string {
	const keys = key.split(".");
	let result: string | NestedRecord = obj;
	for (const k of keys) {
		if (result && typeof result === "object") {
			result = result[k];
		} else {
			return key;
		}
	}
	return typeof result === "string" ? result : key;
}

interface I18nContextType {
	language: Language;
	t: (key: string) => string;
	setLanguage: (lang: Language) => Promise<void>;
	locale: string;
}

const I18nContext = createContext<I18nContextType>({
	language: "en",
	t: (key) => key,
	setLanguage: async () => {},
	locale: "en-US",
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [language, setLang] = useState<Language>("en");
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		api
			.getLanguage()
			.then((lang) => {
				if (lang === "tr" || lang === "en") setLang(lang);
			})
			.catch(() => {})
			.finally(() => setLoaded(true));
	}, []);

	const t = (key: string): string => resolve(translations[language], key);

	const setLanguage = async (lang: Language) => {
		await api.setLanguage(lang);
		setLang(lang);
	};

	const locale = language === "tr" ? "tr-TR" : "en-US";

	if (!loaded) return null;

	return (
		<I18nContext.Provider value={{ language, t, setLanguage, locale }}>
			{children}
		</I18nContext.Provider>
	);
}

export function useI18n() {
	return useContext(I18nContext);
}
