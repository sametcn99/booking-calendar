import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Input } from "baseui/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "baseui/modal";
import { Textarea } from "baseui/textarea";
import { toaster } from "baseui/toast";
import { Palette } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../api";
import { useThemeColors } from "../../../context/ThemeContext";
import {
	APP_THEME_COLOR_KEYS,
	type AppColorKey,
	type AppColors,
	DEFAULT_APP_COLORS,
} from "../../../theme";

const rgbaRegex =
	/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|0?\.\d+|1(?:\.0+)?)\s*\)$/i;
const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;

function clampByte(value: number): number {
	return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(value: number): string {
	return clampByte(value).toString(16).padStart(2, "0");
}

function extractPickerHex(color: string): string {
	const normalized = color.trim();
	if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
		return normalized;
	}

	if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
		return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
	}

	const rgbaMatch = normalized.match(rgbaRegex) || normalized.match(rgbRegex);
	if (!rgbaMatch) {
		return "#000000";
	}

	const r = Number(rgbaMatch[1]);
	const g = Number(rgbaMatch[2]);
	const b = Number(rgbaMatch[3]);
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hexColor: string) {
	const hex = hexColor.replace("#", "");
	const normalized =
		hex.length === 3
			? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
			: hex;
	return {
		r: Number.parseInt(normalized.slice(0, 2), 16),
		g: Number.parseInt(normalized.slice(2, 4), 16),
		b: Number.parseInt(normalized.slice(4, 6), 16),
	};
}

function preserveAlphaIfNeeded(previous: string, nextHex: string): string {
	const match = previous.trim().match(rgbaRegex);
	if (!match) {
		return nextHex;
	}
	const alpha = match[4];
	const { r, g, b } = hexToRgb(nextHex);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isValidColorValue(value: string): boolean {
	const normalized = value.trim();
	return (
		/^#[0-9a-fA-F]{6}$/.test(normalized) ||
		/^#[0-9a-fA-F]{3}$/.test(normalized) ||
		/^rgba?\(\s*(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*(,\s*(0|0?\.\d+|1(?:\.0+)?)\s*)?\)$/.test(
			normalized,
		)
	);
}

function parseDeveloperColors(jsonText: string): AppColors | null {
	try {
		const parsed = JSON.parse(jsonText) as unknown;
		if (!parsed || typeof parsed !== "object") {
			return null;
		}

		const candidate = parsed as Record<string, unknown>;
		for (const key of APP_THEME_COLOR_KEYS) {
			const value = candidate[key];
			if (typeof value !== "string" || !isValidColorValue(value)) {
				return null;
			}
		}

		return Object.fromEntries(
			APP_THEME_COLOR_KEYS.map((key) => [
				key,
				(candidate[key] as string).trim(),
			]),
		) as AppColors;
	} catch {
		return null;
	}
}

function toLabel(key: AppColorKey): string {
	return key
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (char) => char.toUpperCase());
}

interface Props {
	t: (key: string) => string;
	surface?: "card" | "list";
}

export default function ThemeColorsSection({ t, surface = "card" }: Props) {
	const [css] = useStyletron();
	const {
		colors,
		mode,
		previewColors,
		applyCustomColors,
		resetToDefaultColors,
	} = useThemeColors();
	const [isOpen, setIsOpen] = useState(false);
	const [developerView, setDeveloperView] = useState(false);
	const [draftColors, setDraftColors] = useState<AppColors>(colors);
	const [developerJson, setDeveloperJson] = useState(
		JSON.stringify(colors, null, 2),
	);
	const [saving, setSaving] = useState(false);
	const initialColorsRef = useRef<AppColors | null>(null);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isList = surface === "list";

	const entries = useMemo(
		() => APP_THEME_COLOR_KEYS.map((key) => ({ key, label: toLabel(key) })),
		[],
	);

	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	const openModal = () => {
		initialColorsRef.current = colors;
		setDraftColors(colors);
		setDeveloperJson(JSON.stringify(colors, null, 2));
		setDeveloperView(false);
		setIsOpen(true);
	};

	const closeWithoutSaving = () => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}
		if (initialColorsRef.current) {
			previewColors(initialColorsRef.current);
		}
		setIsOpen(false);
	};

	const handleColorChange = (key: AppColorKey, nextHex: string) => {
		const nextColors: AppColors = {
			...draftColors,
			[key]: preserveAlphaIfNeeded(draftColors[key], nextHex),
		};
		setDraftColors(nextColors);
		setDeveloperJson(JSON.stringify(nextColors, null, 2));

		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			previewColors(nextColors);
		}, 500);
	};

	const handleSave = async () => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}
		const payload = developerView
			? parseDeveloperColors(developerJson)
			: draftColors;
		if (!payload) {
			toaster.negative(t("settings.themeDeveloperInvalid"), {});
			return;
		}

		setSaving(true);
		try {
			await api.saveThemeColors(payload);
			applyCustomColors(payload);
			setDraftColors(payload);
			setDeveloperJson(JSON.stringify(payload, null, 2));
			setIsOpen(false);
			toaster.positive(t("settings.themeSaved"), {});
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : t("common.error");
			toaster.negative(message, {});
		} finally {
			setSaving(false);
		}
	};

	const handleResetDefault = async () => {
		setSaving(true);
		try {
			await api.resetThemeColors();
			resetToDefaultColors();
			setDraftColors(DEFAULT_APP_COLORS);
			setDeveloperJson(JSON.stringify(DEFAULT_APP_COLORS, null, 2));
			setIsOpen(false);
			toaster.positive(t("settings.themeReset"), {});
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : t("common.error");
			toaster.negative(message, {});
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<div
				className={css({
					backgroundColor: "var(--color-bg-secondary)",
					borderRadius: isList ? "10px" : "12px",
					padding: isList ? "18px" : "24px",
					border: "1px solid var(--color-bg-quaternary)",
				})}
			>
				<h2
					className={css({
						fontSize: "18px",
						fontWeight: 700,
						color: "var(--color-text-primary)",
						marginBottom: "8px",
					})}
				>
					{t("settings.themeColors")}
				</h2>
				<p
					className={css({
						fontSize: "13px",
						lineHeight: 1.5,
						color: "var(--color-text-secondary)",
						marginBottom: "14px",
					})}
				>
					{t("settings.themeColorsDescription")}
				</p>
				<div
					className={css({
						display: "flex",
						gap: "10px",
						flexWrap: "wrap",
						alignItems: "center",
					})}
				>
					<Button kind={KIND.secondary} size={SIZE.compact} onClick={openModal}>
						<Palette size={14} />
						<span className={css({ marginLeft: "6px" })}>
							{t("settings.themeEdit")}
						</span>
					</Button>
					<span
						className={css({
							fontSize: "12px",
							color: "var(--color-text-subtle)",
						})}
					>
						{mode === "default"
							? t("settings.themeModeDefault")
							: t("settings.themeModeCustom")}
					</span>
				</div>
			</div>

			<Modal isOpen={isOpen} onClose={closeWithoutSaving} animate autoFocus>
				<ModalHeader>{t("settings.themeModalTitle")}</ModalHeader>
				<ModalBody>
					<div
						className={css({
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "12px",
							gap: "12px",
							flexWrap: "wrap",
						})}
					>
						<Button
							kind={KIND.tertiary}
							size={SIZE.compact}
							onClick={() => setDeveloperView((prev) => !prev)}
						>
							{developerView
								? t("settings.themeDeveloperHide")
								: t("settings.themeDeveloperShow")}
						</Button>
						<span
							className={css({
								fontSize: "12px",
								color: "var(--color-text-subtle)",
							})}
						>
							{t("settings.themeDeveloperHint")}
						</span>
					</div>

					{developerView ? (
						<Textarea
							value={developerJson}
							onChange={(e) => setDeveloperJson(e.currentTarget.value)}
							overrides={{
								Input: {
									style: {
										minHeight: "380px",
										fontFamily:
											"ui-monospace, SFMono-Regular, Menlo, monospace",
										fontSize: "12px",
									},
								},
							}}
						/>
					) : (
						<div
							className={css({
								display: "grid",
								gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
								gap: "10px",
								maxHeight: "420px",
								overflowY: "auto",
								overflowX: "hidden",
								paddingRight: "4px",
							})}
						>
							{entries.map((entry) => (
								<div
									key={entry.key}
									className={css({
										display: "flex",
										alignItems: "center",
										gap: "10px",
										padding: "8px 10px",
										border: "1px solid var(--color-bg-quaternary)",
										borderRadius: "8px",
										backgroundColor: "var(--color-bg-tertiary)",
									})}
								>
									<div
										className={css({
											fontSize: "12px",
											color: "var(--color-text-secondary)",
											flex: 1,
										})}
									>
										{entry.label}
									</div>
									<Input
										value={draftColors[entry.key]}
										disabled
										size={SIZE.mini}
										overrides={{
											Input: { style: { width: "100px", fontSize: "11px" } },
										}}
									/>
									<input
										type="color"
										title={entry.label}
										aria-label={entry.label}
										value={extractPickerHex(draftColors[entry.key])}
										onChange={(event) =>
											handleColorChange(entry.key, event.currentTarget.value)
										}
										className={css({
											width: "34px",
											height: "28px",
											border: "none",
											background: "transparent",
											padding: 0,
											cursor: "pointer",
										})}
									/>
								</div>
							))}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<div
						className={css({
							display: "flex",
							gap: "10px",
							justifyContent: "flex-end",
							width: "100%",
						})}
					>
						<Button
							kind={KIND.tertiary}
							size={SIZE.compact}
							onClick={handleResetDefault}
							disabled={saving}
						>
							{t("settings.themeResetButton")}
						</Button>
						<Button
							kind={KIND.secondary}
							size={SIZE.compact}
							onClick={closeWithoutSaving}
							disabled={saving}
						>
							{t("settings.cancel")}
						</Button>
						<Button size={SIZE.compact} onClick={handleSave} isLoading={saving}>
							{t("settings.themeSaveButton")}
						</Button>
					</div>
				</ModalFooter>
			</Modal>
		</>
	);
}
