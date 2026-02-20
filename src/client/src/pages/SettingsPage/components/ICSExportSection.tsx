import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Input } from "baseui/input";
import { Download } from "lucide-react";
import { useState } from "react";
import { api } from "../../../api";

interface Props {
	t: (key: string) => string;
	surface?: "card" | "list";
}

async function downloadIcs(url: string) {
	const res = await fetch(url, { credentials: "include" });
	if (!res.ok) throw new Error("Export failed");
	const blob = await res.blob();
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "calendar-export.ics";
	a.click();
	URL.revokeObjectURL(a.href);
}

export default function ICSExportSection({ t, surface = "card" }: Props) {
	const [css] = useStyletron();
	const isList = surface === "list";
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");

	const handleExportAll = () => {
		downloadIcs(api.getIcsExportUrl());
	};

	const handleExportRange = () => {
		if (!from || !to) return;
		downloadIcs(api.getIcsExportUrl(from, to));
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
				{t("settings.icsExport")}
			</h2>
			<div
				className={css({
					fontSize: "13px",
					color: "var(--color-text-secondary)",
					marginBottom: "14px",
				})}
			>
				{t("settings.icsExportDescription")}
			</div>

			<Button
				kind={KIND.secondary}
				size={SIZE.compact}
				onClick={handleExportAll}
				overrides={{
					BaseButton: {
						style: { marginBottom: "16px", width: "100%" },
					},
				}}
			>
				<Download size={14} />
				<span className={css({ marginLeft: "6px" })}>
					{t("settings.icsExportAll")}
				</span>
			</Button>

			<div
				className={css({
					fontSize: "14px",
					fontWeight: 600,
					color: "var(--color-text-primary)",
					marginBottom: "10px",
				})}
			>
				{t("settings.icsExportRange")}
			</div>
			<div
				className={css({
					display: "flex",
					gap: "10px",
					marginBottom: "12px",
					flexWrap: "wrap",
				})}
			>
				<div className={css({ flex: 1, minWidth: "140px" })}>
					<div
						className={css({
							fontSize: "12px",
							color: "var(--color-text-secondary)",
							marginBottom: "4px",
						})}
					>
						{t("settings.icsExportFrom")}
					</div>
					<Input
						value={from}
						onChange={(e) => setFrom(e.currentTarget.value)}
						type="date"
						size={SIZE.compact}
					/>
				</div>
				<div className={css({ flex: 1, minWidth: "140px" })}>
					<div
						className={css({
							fontSize: "12px",
							color: "var(--color-text-secondary)",
							marginBottom: "4px",
						})}
					>
						{t("settings.icsExportTo")}
					</div>
					<Input
						value={to}
						onChange={(e) => setTo(e.currentTarget.value)}
						type="date"
						size={SIZE.compact}
					/>
				</div>
			</div>
			<Button
				kind={KIND.secondary}
				size={SIZE.compact}
				onClick={handleExportRange}
				disabled={!from || !to}
				overrides={{
					BaseButton: { style: { width: "100%" } },
				}}
			>
				<Download size={14} />
				<span className={css({ marginLeft: "6px" })}>
					{t("settings.icsExportDownload")}
				</span>
			</Button>
		</div>
	);
}
