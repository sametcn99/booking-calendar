import { useStyletron } from "baseui";
import { Button, KIND } from "baseui/button";
import { Checkbox, STYLE_TYPE } from "baseui/checkbox";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";
import { useState } from "react";

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
	isDirty: boolean;
	revealingInboundSecret: boolean;
	revealingOutboundSecret: boolean;
	saving: boolean;
	testing: boolean;
	onOutboundEnabledChange: (enabled: boolean) => void;
	onOutboundUrlChange: (url: string) => void;
	onOutboundSecretChange: (secret: string) => void;
	onInboundEnabledChange: (enabled: boolean) => void;
	onInboundSecretChange: (secret: string) => void;
	onInboundScopeToggle: (scope: string) => void;
	onRevealOutboundSecret: () => Promise<void> | void;
	onRevealInboundSecret: () => Promise<void> | void;
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
	isDirty,
	revealingInboundSecret,
	revealingOutboundSecret,
	saving,
	testing,
	onOutboundEnabledChange,
	onOutboundUrlChange,
	onOutboundSecretChange,
	onInboundEnabledChange,
	onInboundSecretChange,
	onInboundScopeToggle,
	onRevealOutboundSecret,
	onRevealInboundSecret,
	onSubmit,
	onSendTest,
	t,
	surface = "card",
}: Props) {
	const [css] = useStyletron();
	const [isOutboundSecretVisible, setIsOutboundSecretVisible] = useState(false);
	const [isInboundSecretVisible, setIsInboundSecretVisible] = useState(false);
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

	const noticeStyles = css({
		fontSize: "12px",
		color: "var(--color-text-subtle)",
		marginTop: "10px",
		marginBottom: 0,
	});

	const handleToggleOutboundSecretVisibility = async () => {
		if (
			!isOutboundSecretVisible &&
			outboundSecret.length === 0 &&
			outboundHasSecret
		) {
			await onRevealOutboundSecret();
		}
		setIsOutboundSecretVisible((visible) => !visible);
	};

	const handleToggleInboundSecretVisibility = async () => {
		if (
			!isInboundSecretVisible &&
			inboundSecret.length === 0 &&
			inboundHasSecret
		) {
			await onRevealInboundSecret();
		}
		setIsInboundSecretVisible((visible) => !visible);
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

						{outboundHasSecret ? (
							<p className={noticeStyles}>
								{t("settings.webhookSecretConfigured")}
							</p>
						) : null}

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
									caption={
										outboundHasSecret && outboundSecret.length === 0
											? t("settings.webhookSecretHiddenHint")
											: t("settings.webhookSecretHint")
									}
								>
									<div
										className={css({
											display: "grid",
											gridTemplateColumns: "1fr",
											gap: "8px",
											"@media screen and (min-width: 700px)": {
												gridTemplateColumns: "minmax(0, 1fr) auto auto",
												alignItems: "center",
											},
										})}
									>
										<Input
											type={isOutboundSecretVisible ? "text" : "password"}
											value={outboundSecret}
											onChange={(e) =>
												onOutboundSecretChange(e.currentTarget.value)
											}
											placeholder={
												outboundHasSecret && outboundSecret.length === 0
													? t("settings.webhookSecretHiddenHint")
													: t("settings.webhookSecretPlaceholder")
											}
											autoComplete="new-password"
										/>
										{outboundHasSecret ? (
											<Button
												type="button"
												kind={KIND.secondary}
												onClick={handleToggleOutboundSecretVisibility}
												isLoading={revealingOutboundSecret}
												disabled={saving}
											>
												{isOutboundSecretVisible
													? t("settings.webhookHideSecret")
													: t("settings.webhookRevealSecret")}
											</Button>
										) : null}
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

						{inboundHasSecret ? (
							<p className={noticeStyles}>
								{t("settings.webhookInboundSecretConfigured")}
							</p>
						) : null}

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
									caption={
										inboundHasSecret && inboundSecret.length === 0
											? t("settings.webhookInboundSecretHiddenHint")
											: t("settings.webhookInboundSecretHint")
									}
								>
									<div
										className={css({
											display: "grid",
											gridTemplateColumns: "1fr",
											gap: "8px",
											"@media screen and (min-width: 700px)": {
												gridTemplateColumns: "minmax(0, 1fr) auto auto",
												alignItems: "center",
											},
										})}
									>
										<Input
											type={isInboundSecretVisible ? "text" : "password"}
											value={inboundSecret}
											onChange={(e) =>
												onInboundSecretChange(e.currentTarget.value)
											}
											placeholder={
												inboundHasSecret && inboundSecret.length === 0
													? t("settings.webhookInboundSecretHiddenHint")
													: t("settings.webhookInboundSecretPlaceholder")
											}
											autoComplete="new-password"
										/>
										{inboundHasSecret ? (
											<Button
												type="button"
												kind={KIND.secondary}
												onClick={handleToggleInboundSecretVisibility}
												isLoading={revealingInboundSecret}
												disabled={saving}
											>
												{isInboundSecretVisible
													? t("settings.webhookHideSecret")
													: t("settings.webhookRevealSecret")}
											</Button>
										) : null}
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

					{isDirty || outboundEnabled ? (
						<div
							className={css({
								display: "flex",
								gap: "10px",
								flexWrap: "wrap",
							})}
						>
							{isDirty ? (
								<Button type="submit" isLoading={saving}>
									{t("settings.webhookSave")}
								</Button>
							) : null}
							{outboundEnabled ? (
								<Button
									type="button"
									kind={KIND.secondary}
									onClick={onSendTest}
									isLoading={testing}
									disabled={saving || isDirty}
								>
									{t("settings.webhookSendTest")}
								</Button>
							) : null}
						</div>
					) : null}
				</div>
			</form>
		</div>
	);
}
