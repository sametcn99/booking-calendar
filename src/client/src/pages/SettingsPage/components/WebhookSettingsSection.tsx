import { useStyletron } from "baseui";
import { Button, KIND } from "baseui/button";
import { Checkbox, STYLE_TYPE } from "baseui/checkbox";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";

interface Props {
	enabled: boolean;
	url: string;
	secret: string;
	hasSecret: boolean;
	saving: boolean;
	testing: boolean;
	onEnabledChange: (enabled: boolean) => void;
	onUrlChange: (url: string) => void;
	onSecretChange: (secret: string) => void;
	onSubmit: (event: React.FormEvent) => void;
	onSendTest: () => void;
	t: (key: string) => string;
	surface?: "card" | "list";
}

export default function WebhookSettingsSection({
	enabled,
	url,
	secret,
	hasSecret,
	saving,
	testing,
	onEnabledChange,
	onUrlChange,
	onSecretChange,
	onSubmit,
	onSendTest,
	t,
	surface = "card",
}: Props) {
	const [css] = useStyletron();
	const isList = surface === "list";

	const handleGenerateSecret = () => {
		const bytes = new Uint8Array(32);
		crypto.getRandomValues(bytes);
		const generated = Array.from(bytes, (byte) =>
			byte.toString(16).padStart(2, "0"),
		).join("");
		onSecretChange(generated);
	};

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
				{t("settings.webhook")}
			</h2>
			<div
				className={css({
					fontSize: "13px",
					color: "var(--color-text-secondary)",
					marginBottom: "14px",
				})}
			>
				{t("settings.webhookDescription")}
			</div>

			<form onSubmit={onSubmit}>
				<Checkbox
					checked={enabled}
					onChange={(e) => onEnabledChange(e.currentTarget.checked)}
					checkmarkType={STYLE_TYPE.toggle_round}
					disabled={saving}
				>
					{enabled
						? t("settings.webhookEnabled")
						: t("settings.webhookDisabled")}
				</Checkbox>

				{enabled ? (
					<>
						<FormControl label={t("settings.webhookUrl")}>
							<Input
								type="url"
								value={url}
								onChange={(e) => onUrlChange(e.currentTarget.value)}
								placeholder={t("settings.webhookUrlPlaceholder")}
								autoComplete="off"
							/>
						</FormControl>

						<FormControl
							label={t("settings.webhookSecret")}
							caption={t("settings.webhookSecretHint")}
						>
							<div
								className={css({
									display: "grid",
									gridTemplateColumns: "1fr",
									gap: "8px",
									"@media screen and (min-width: 700px)": {
										gridTemplateColumns: "minmax(0, 1fr) auto",
										alignItems: "center",
									},
								})}
							>
								<Input
									type="password"
									value={secret}
									onChange={(e) => onSecretChange(e.currentTarget.value)}
									placeholder={t("settings.webhookSecretPlaceholder")}
									autoComplete="new-password"
								/>
								<Button
									type="button"
									kind={KIND.secondary}
									onClick={handleGenerateSecret}
									disabled={saving}
								>
									{t("settings.webhookGenerateSecret")}
								</Button>
							</div>
						</FormControl>

						{hasSecret ? (
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-subtle)",
									marginBottom: "10px",
								})}
							>
								{t("settings.webhookSecretConfigured")}
							</div>
						) : null}

						<div
							className={css({
								display: "flex",
								gap: "10px",
								flexWrap: "wrap",
							})}
						>
							<Button type="submit" isLoading={saving}>
								{t("settings.webhookSave")}
							</Button>
							<Button
								type="button"
								kind={KIND.secondary}
								onClick={onSendTest}
								isLoading={testing}
								disabled={saving}
							>
								{t("settings.webhookSendTest")}
							</Button>
						</div>
					</>
				) : null}
			</form>
		</div>
	);
}
