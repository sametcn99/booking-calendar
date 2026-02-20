export const APP_THEME_COLOR_KEYS = [
	"bgPrimary",
	"bgSecondary",
	"bgTertiary",
	"bgQuaternary",
	"bgOffRange",
	"textPrimary",
	"textSecondary",
	"textTertiary",
	"textMuted",
	"textSubtle",
	"textFaint",
	"textOnPrimary",
	"textDisabled",
	"textDisabledAlt",
	"textOnMuted",
	"accent100",
	"accent200",
	"accent300",
	"accent400",
	"accent500",
	"accent600",
	"accent700",
	"accent800",
	"borderPrimary",
	"borderTransparent",
	"successBg",
	"successText",
	"success",
	"successLight",
	"errorBg",
	"errorHover",
	"errorText",
	"error",
	"warning",
	"warningLight",
	"warningBg",
	"warningDarkBg",
	"warningDarkHover",
	"info",
	"overlay",
] as const;

export type AppThemeColors = Record<
	(typeof APP_THEME_COLOR_KEYS)[number],
	string
>;

function isValidCssColorValue(value: string): boolean {
	const normalized = value.trim();
	return (
		/^#[0-9a-fA-F]{6}$/.test(normalized) ||
		/^#[0-9a-fA-F]{3}$/.test(normalized) ||
		/^rgba?\(\s*(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*(,\s*(0|0?\.\d+|1(?:\.0+)?)\s*)?\)$/.test(
			normalized,
		)
	);
}

export function parseThemeColorsFromUnknown(
	input: unknown,
): AppThemeColors | null {
	if (!input || typeof input !== "object") {
		return null;
	}

	const candidate = input as Record<string, unknown>;
	for (const key of APP_THEME_COLOR_KEYS) {
		const value = candidate[key];
		if (typeof value !== "string" || !isValidCssColorValue(value)) {
			return null;
		}
	}

	return Object.fromEntries(
		APP_THEME_COLOR_KEYS.map((key) => [key, (candidate[key] as string).trim()]),
	) as AppThemeColors;
}
