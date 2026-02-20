import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { api } from "../api";
import {
	APP_THEME_COLOR_KEYS,
	type AppColors,
	applyAppColorVariables,
	createAppTheme,
	DEFAULT_APP_COLORS,
} from "../theme";

type ThemeMode = "default" | "custom";

const THEME_MODE_STORAGE_KEY = "app_theme_mode";
const THEME_COLORS_STORAGE_KEY = "app_theme_colors";

function isValidColorValue(value: string): boolean {
	return (
		/^#[0-9a-fA-F]{6}$/.test(value) ||
		/^#[0-9a-fA-F]{3}$/.test(value) ||
		/^rgba?\(\s*(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*(,\s*(0|0?\.\d+|1(?:\.0+)?)\s*)?\)$/.test(
			value,
		)
	);
}

function parseColorRecord(input: unknown): AppColors | null {
	if (!input || typeof input !== "object") {
		return null;
	}

	const candidate = input as Record<string, unknown>;
	for (const key of APP_THEME_COLOR_KEYS) {
		const value = candidate[key];
		if (typeof value !== "string" || !isValidColorValue(value.trim())) {
			return null;
		}
	}

	return Object.fromEntries(
		APP_THEME_COLOR_KEYS.map((key) => [key, (candidate[key] as string).trim()]),
	) as AppColors;
}

interface ThemeContextType {
	colors: AppColors;
	theme: ReturnType<typeof createAppTheme>;
	mode: ThemeMode;
	loaded: boolean;
	previewColors: (colors: AppColors) => void;
	applyCustomColors: (colors: AppColors) => void;
	resetToDefaultColors: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
	colors: DEFAULT_APP_COLORS,
	theme: createAppTheme(DEFAULT_APP_COLORS),
	mode: "default",
	loaded: false,
	previewColors: () => {},
	applyCustomColors: () => {},
	resetToDefaultColors: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [colors, setColors] = useState<AppColors>(DEFAULT_APP_COLORS);
	const [mode, setMode] = useState<ThemeMode>("default");
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		const storedMode = localStorage.getItem(
			THEME_MODE_STORAGE_KEY,
		) as ThemeMode | null;
		const cachedRaw = localStorage.getItem(THEME_COLORS_STORAGE_KEY);
		let cachedColors: AppColors | null = null;
		if (cachedRaw) {
			try {
				cachedColors = parseColorRecord(JSON.parse(cachedRaw) as unknown);
			} catch {
				cachedColors = null;
			}
		}

		if (cachedColors) {
			setColors(cachedColors);
			setMode("custom");
		}

		const shouldFetchFromServer =
			storedMode === "custom" || (storedMode === null && !cachedColors);
		if (!shouldFetchFromServer) {
			if (storedMode === "default") {
				setColors(DEFAULT_APP_COLORS);
				setMode("default");
			}
			setLoaded(true);
			return;
		}

		api
			.getThemeColors()
			.then((serverColors) => {
				const parsed = parseColorRecord(serverColors);
				if (!parsed) {
					setColors(DEFAULT_APP_COLORS);
					setMode("default");
					localStorage.setItem(THEME_MODE_STORAGE_KEY, "default");
					localStorage.removeItem(THEME_COLORS_STORAGE_KEY);
					return;
				}

				setColors(parsed);
				setMode("custom");
				localStorage.setItem(THEME_MODE_STORAGE_KEY, "custom");
				localStorage.setItem(THEME_COLORS_STORAGE_KEY, JSON.stringify(parsed));
			})
			.catch(() => {
				setColors(DEFAULT_APP_COLORS);
				setMode("default");
			})
			.finally(() => setLoaded(true));
	}, []);

	useEffect(() => {
		applyAppColorVariables(colors);
	}, [colors]);

	const previewColors = useCallback((nextColors: AppColors) => {
		setColors(nextColors);
	}, []);

	const applyCustomColors = useCallback((nextColors: AppColors) => {
		setColors(nextColors);
		setMode("custom");
		localStorage.setItem(THEME_MODE_STORAGE_KEY, "custom");
		localStorage.setItem(THEME_COLORS_STORAGE_KEY, JSON.stringify(nextColors));
	}, []);

	const resetToDefaultColors = useCallback(() => {
		setColors(DEFAULT_APP_COLORS);
		setMode("default");
		localStorage.setItem(THEME_MODE_STORAGE_KEY, "default");
		localStorage.removeItem(THEME_COLORS_STORAGE_KEY);
	}, []);

	const theme = useMemo(() => createAppTheme(colors), [colors]);

	return (
		<ThemeContext.Provider
			value={{
				colors,
				theme,
				mode,
				loaded,
				previewColors,
				applyCustomColors,
				resetToDefaultColors,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useThemeColors() {
	return useContext(ThemeContext);
}
