import { useStyletron } from "baseui";
import { Button } from "baseui/button";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";
import { Tag } from "baseui/tag";
import { useEffect, useMemo, useState } from "react";

interface Props {
	adminEmail: string;
	savedAdminEmail?: string;
	onSubmit: (event: React.FormEvent) => void;
	savingAdminEmail: boolean;
	setAdminEmail: (value: string) => void;
	t: (key: string) => string;
	keyPrefix?: string;
	surface?: "card" | "list";
}

export default function AdminEmailSection({
	adminEmail,
	savedAdminEmail,
	onSubmit,
	savingAdminEmail,
	setAdminEmail,
	t,
	keyPrefix = "dashboard",
	surface = "card",
}: Props) {
	const [css] = useStyletron();
	const isList = surface === "list";
	const hasSavedEmail = Boolean(
		savedAdminEmail && savedAdminEmail.trim().length > 0,
	);
	const [isExpanded, setIsExpanded] = useState(!hasSavedEmail);

	useEffect(() => {
		setIsExpanded(!hasSavedEmail);
	}, [hasSavedEmail]);

	const isUnchanged = useMemo(() => {
		const normalizedCurrent = adminEmail.trim().toLowerCase();
		const normalizedSaved = (savedAdminEmail || "").trim().toLowerCase();
		return (
			normalizedCurrent.length > 0 && normalizedCurrent === normalizedSaved
		);
	}, [adminEmail, savedAdminEmail]);

	return (
		<div
			className={css({
				backgroundColor: "var(--color-bg-secondary)",
				borderRadius: isList ? "10px" : "12px",
				padding: isList ? "18px" : "24px",
				border: "1px solid var(--color-bg-quaternary)",
			})}
		>
			<div
				className={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "10px",
					marginBottom: "12px",
				})}
			>
				<button
					type="button"
					onClick={() => setIsExpanded((prev) => !prev)}
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: 0,
						border: 0,
						background: "transparent",
						color: "var(--color-text-primary)",
						cursor: "pointer",
					})}
				>
					<span
						className={css({
							fontSize: "18px",
							fontWeight: 700,
						})}
					>
						{t(`${keyPrefix}.adminEmail`)}
					</span>
					<span
						className={css({
							fontSize: "12px",
							color: "var(--color-text-subtle)",
						})}
					>
						{isExpanded ? "[-]" : "[+]"}
					</span>
				</button>

				{hasSavedEmail ? (
					<Tag closeable={false} kind="positive">
						{t(`${keyPrefix}.adminEmailRegistered`)}
					</Tag>
				) : null}
			</div>
			<div
				className={css({
					fontSize: "13px",
					color: "var(--color-text-secondary)",
					marginBottom: isExpanded ? "14px" : "0",
				})}
			>
				{t(`${keyPrefix}.adminEmailDescription`)}
			</div>

			{isExpanded ? (
				<form onSubmit={onSubmit}>
					<FormControl label={t(`${keyPrefix}.adminEmailField`)}>
						<Input
							type="email"
							value={adminEmail}
							onChange={(e) => setAdminEmail(e.currentTarget.value)}
							autoComplete="email"
							placeholder={t(`${keyPrefix}.adminEmailPlaceholder`)}
						/>
					</FormControl>

					<Button
						type="submit"
						isLoading={savingAdminEmail}
						disabled={isUnchanged}
					>
						{t(`${keyPrefix}.saveAdminEmail`)}
					</Button>
				</form>
			) : null}
		</div>
	);
}
