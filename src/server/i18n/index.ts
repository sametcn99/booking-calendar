import { SettingsRepository } from "../repositories/SettingsRepository";
import en from "./en.json";
import tr from "./tr.json";

type NestedRecord = { [key: string]: string | NestedRecord };

const translations: Record<string, NestedRecord> = { en, tr };

let currentLanguage = "en";

export function setLanguage(lang: string): void {
	if (translations[lang]) currentLanguage = lang;
}

export function getLanguage(): string {
	return currentLanguage;
}

export function t(key: string): string {
	const keys = key.split(".");
	let result: string | NestedRecord = translations[currentLanguage];
	for (const k of keys) {
		if (result && typeof result === "object") {
			result = result[k];
		} else {
			return key;
		}
	}
	return typeof result === "string" ? result : key;
}

export async function loadLanguageFromDB(): Promise<void> {
	const repo = new SettingsRepository();
	const lang = await repo.get("language");
	if (lang && translations[lang]) {
		currentLanguage = lang;
	}
}
