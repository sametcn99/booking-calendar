import { useStyletron } from "baseui";
import { Button, KIND } from "baseui/button";
import { Checkbox, STYLE_TYPE } from "baseui/checkbox";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";

interface Props {
	outboundEnabled: boolean;
	outboundUrl: string;
	outboundSecret: string;
	outboundHasSecret: boolean;
	inboundEnabled: boolean;
	inboundEndpoint: string;
	inboundSecret: string;
	inboundHasSecret: boolean;
	inboundScopes: string[];
	saving: boolean;
	testing: boolean;
	onOutboundEnabledChange: (enabled: boolean) => void;
	onOutboundUrlChange: (url: string) => void;
	onOutboundSecretChange: (secret: string) => void;
	onInboundEnabledChange: (enabled: boolean) => void;
	onInboundSecretChange: (secret: string) => void;
	onInboundScopeToggle: (scope: string) => void;
	onSubmit: (event: React.FormEvent) => void;
	onSendTest: () => void;
	t: (key: string) => string;
	surface?: "card" | "list";
}

export default function WebhookSettingsSection({
	outboundEnabled,
	outboundUrl,
	outboundSecret,
	outboundHasSecret,
	inboundEnabled,
	inboundEndpoint,
	inboundSecret,
	inboundHasSecret,
	inboundScopes,
	saving,
	testing,
	onOutboundEnabledChange,
	onOutboundUrlChange,
	onOutboundSecretChange,
	onInboundEnabledChange,
	onInboundSecretChange,
	onInboundScopeToggle,
	onSubmit,
	onSendTest,
	t,
	surface = "card",
}: Props) {
	const [css] = useStyletron();
	const isList = surface === "list";
	const scopeOptions = [
		"admin.slots",
		"admin.appointments",
		"admin.links",
		"admin.planner",
		"admin.community-events",
		"public.booking",
		"public.appointment",
		"public.community",
	];

	const handleGenerateSecret = (onChange: (secret: string) => void) => {
		const bytes = new Uint8Array(32);
		crypto.getRandomValues(bytes);
		const generated = Array.from(bytes, (byte) =>
			byte.toString(16).padStart(2, "0"),
		).join("");
		onChange(generated);
	};

	const cardStyles = {
		padding: "16px",
		borderRadius: "10px",
		border: "1px solid var(--color-bg-quaternary)",
		backgroundColor: "var(--color-bg-tertiary)",
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
				<div
					className={css({
						display: "grid",
						gap: "16px",
					})}
				>
					<div className={css(cardStyles)}>
						<div
							className={css({
								fontSize: "15px",
								fontWeight: 700,
								color: "var(--color-text-primary)",
								marginBottom: "6px",
							})}
						>
							{t("settings.webhookOutboundTitle")}
						</div>
						<div
							className={css({
								fontSize: "13px",
								color: "var(--color-text-secondary)",
								marginBottom: "12px",
							})}
						>
							{t("settings.webhookOutboundDescription")}
						</div>

						<Checkbox
							checked={outboundEnabled}
							onChange={(e) => onOutboundEnabledChange(e.currentTarget.checked)}
							checkmarkType={STYLE_TYPE.toggle_round}
							disabled={saving}
						>
							{outboundEnabled
								? t("settings.webhookEnabled")
								: t("settings.webhookDisabled")}
						</Checkbox>

						{outboundEnabled ? (
							<>
								<FormControl label={t("settings.webhookUrl")}>
									<Input
										type="url"
										value={outboundUrl}
										onChange={(e) => onOutboundUrlChange(e.currentTarget.value)}
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
											value={outboundSecret}
											onChange={(e) =>
												onOutboundSecretChange(e.currentTarget.value)
											}
											placeholder={t("settings.webhookSecretPlaceholder")}
											autoComplete="new-password"
										/>
										<Button
											type="button"
											kind={KIND.secondary}
											onClick={() =>
												handleGenerateSecret(onOutboundSecretChange)
											}
											disabled={saving}
										>
											{t("settings.webhookGenerateSecret")}
										</Button>
									</div>
								</FormControl>

								{outboundHasSecret ? (
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
					</div>

					<div className={css(cardStyles)}>
						<div
							className={css({
								fontSize: "15px",
								fontWeight: 700,
								color: "var(--color-text-primary)",
								marginBottom: "6px",
							})}
						>
							{t("settings.webhookInboundTitle")}
						</div>
						<div
							className={css({
								fontSize: "13px",
								color: "var(--color-text-secondary)",
								marginBottom: "12px",
							})}
						>
							{t("settings.webhookInboundDescription")}
						</div>

						<Checkbox
							checked={inboundEnabled}
							onChange={(e) => onInboundEnabledChange(e.currentTarget.checked)}
							checkmarkType={STYLE_TYPE.toggle_round}
							disabled={saving}
						>
							{inboundEnabled
								? t("settings.webhookInboundEnabled")
								: t("settings.webhookInboundDisabled")}
						</Checkbox>

						<FormControl
							label={t("settings.webhookInboundEndpoint")}
							caption={t("settings.webhookInboundEndpointHint")}
						>
							<Input value={inboundEndpoint} readOnly />
						</FormControl>

						{inboundEnabled ? (
							<>
								<FormControl
									label={t("settings.webhookInboundSecret")}
									caption={t("settings.webhookInboundSecretHint")}
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
											value={inboundSecret}
											onChange={(e) =>
												onInboundSecretChange(e.currentTarget.value)
											}
											placeholder={t(
												"settings.webhookInboundSecretPlaceholder",
											)}
											autoComplete="new-password"
										/>
										<Button
											type="button"
											kind={KIND.secondary}
											onClick={() =>
												handleGenerateSecret(onInboundSecretChange)
											}
											disabled={saving}
										>
											{t("settings.webhookGenerateSecret")}
										</Button>
									</div>
								</FormControl>

								{inboundHasSecret ? (
									<div
										className={css({
											fontSize: "12px",
											color: "var(--color-text-subtle)",
											marginBottom: "10px",
										})}
									>
										{t("settings.webhookInboundSecretConfigured")}
									</div>
								) : null}

								<FormControl
									label={t("settings.webhookInboundScopes")}
									caption={t("settings.webhookInboundScopesHint")}
								>
									<div
										className={css({
											display: "grid",
											gap: "8px",
										})}
									>
										{scopeOptions.map((scope) => (
											<Checkbox
												key={scope}
												checked={inboundScopes.includes(scope)}
												onChange={() => onInboundScopeToggle(scope)}
												disabled={saving}
											>
												{scope}
											</Checkbox>
										))}
									</div>
								</FormControl>
							</>
						) : null}
					</div>
				</div>
			</form>
		</div>
	);
}
