import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import type { ApiVersionInfo } from "../../../api";

interface Props {
	t: (key: string) => string;
	versionInfo: ApiVersionInfo | null;
	loading: boolean;
	surface?: "card" | "list";
}

export default function VersionSection({
	t,
	versionInfo,
	loading,
	surface = "card",
}: Props) {
	const [css] = useStyletron();
	const isList = surface === "list";

	const statusLabel = loading
		? t("settings.versionChecking")
		: versionInfo?.update_available
			? t("settings.versionUpdateAvailable")
			: versionInfo?.latest_release_version
				? t("settings.versionUpToDate")
				: t("settings.versionNoRelease");

	const latestVersionText = versionInfo?.latest_release_version
		? versionInfo.latest_release_version
		: t("settings.versionNoRelease");
	const releaseUrl = versionInfo?.latest_release_url ?? undefined;

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
				{t("settings.version")}
			</h2>
			<div
				className={css({
					fontSize: "13px",
					color: "var(--color-text-secondary)",
					marginBottom: "14px",
				})}
			>
				{t("settings.versionDescription")}
			</div>

			<div
				className={css({
					display: "grid",
					gap: "8px",
					marginBottom: "14px",
					fontSize: "13px",
					color: "var(--color-text-primary)",
				})}
			>
				<div>
					<strong>{t("settings.currentVersion")}:</strong>{" "}
					{versionInfo?.current_version ?? "undefined"}
				</div>
				<div>
					<strong>{t("settings.latestVersion")}:</strong> {latestVersionText}
				</div>
				<div>
					<strong>{t("settings.versionStatus")}:</strong> {statusLabel}
				</div>
			</div>

			{versionInfo?.update_available && releaseUrl ? (
				<Button
					kind={KIND.secondary}
					size={SIZE.compact}
					onClick={() =>
						window.open(releaseUrl, "_blank", "noopener,noreferrer")
					}
				>
					{t("settings.openLatestRelease")}
				</Button>
			) : null}
		</div>
	);
}
