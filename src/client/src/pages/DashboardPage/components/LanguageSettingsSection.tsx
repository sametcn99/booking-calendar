import { useStyletron } from "baseui";
import { Select } from "baseui/select";

interface Props {
	language: "en" | "tr";
	onLanguageChange: (lang: "en" | "tr") => void;
	savingLanguage: boolean;
	t: (key: string) => string;
	keyPrefix?: string;
	surface?: "card" | "list";
}

export default function LanguageSettingsSection({
	language,
	onLanguageChange,
	savingLanguage,
	t,
	keyPrefix = "dashboard",
	surface = "card",
}: Props) {
	const [css] = useStyletron();
	const isList = surface === "list";

	return (
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
					marginBottom: "12px",
				})}
			>
				{t(`${keyPrefix}.language`)}
			</h2>
			<div
				className={css({
					fontSize: "13px",
					color: "var(--color-text-secondary)",
					marginBottom: "14px",
				})}
			>
				{t(`${keyPrefix}.languageDescription`)}
			</div>
			<Select
				options={[
					{ id: "en", label: t(`${keyPrefix}.langEn`) },
					{ id: "tr", label: t(`${keyPrefix}.langTr`) },
				]}
				value={[{ id: language }]}
				onChange={(params) => {
					const selected = params.value[0]?.id as "en" | "tr";
					if (selected) onLanguageChange(selected);
				}}
				clearable={false}
				disabled={savingLanguage}
				overrides={{
					Root: { style: { maxWidth: "300px" } },
				}}
			/>
		</div>
	);
}
