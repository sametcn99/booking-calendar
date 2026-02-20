import { useStyletron } from "baseui";
import { Button } from "baseui/button";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";

interface Props {
	changingPassword: boolean;
	confirmPassword: string;
	currentPassword: string;
	isOpen: boolean;
	mustChangePassword: boolean;
	newPassword: string;
	onSubmit: (event: React.FormEvent) => void;
	onToggleOpen: () => void;
	setConfirmPassword: (value: string) => void;
	setCurrentPassword: (value: string) => void;
	setNewPassword: (value: string) => void;
	t: (key: string) => string;
	keyPrefix?: string;
	surface?: "card" | "list";
}

export default function PasswordSection({
	changingPassword,
	confirmPassword,
	currentPassword,
	isOpen,
	mustChangePassword,
	newPassword,
	onSubmit,
	onToggleOpen,
	setConfirmPassword,
	setCurrentPassword,
	setNewPassword,
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
			<button
				type="button"
				onClick={onToggleOpen}
				className={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					width: "100%",
					background: "transparent",
					border: "none",
					padding: 0,
					cursor: "pointer",
					marginBottom: isOpen ? "12px" : "0",
				})}
			>
				<h2
					className={css({
						fontSize: "18px",
						fontWeight: 700,
						color: "var(--color-text-primary)",
						margin: 0,
					})}
				>
					{t(`${keyPrefix}.changePassword`)}
				</h2>
				<span
					className={css({
						color: "var(--color-text-secondary)",
						fontSize: "18px",
					})}
				>
					{isOpen ? "-" : "+"}
				</span>
			</button>

			{isOpen && (
				<>
					{mustChangePassword && (
						<div
							className={css({
								marginBottom: "14px",
								padding: "14px 16px",
								borderRadius: "10px",
								border: "1px solid var(--color-warning)",
								backgroundColor: "var(--color-warning-bg)",
								color: "var(--color-warning-light)",
								fontSize: "14px",
								fontWeight: 600,
							})}
						>
							{t(`${keyPrefix}.changePasswordWarning`)}
						</div>
					)}

					<div
						className={css({
							fontSize: "13px",
							color: "var(--color-text-secondary)",
							marginBottom: "14px",
						})}
					>
						{t(`${keyPrefix}.passwordRequirements`)}
					</div>

					<form onSubmit={onSubmit}>
						<FormControl label={t(`${keyPrefix}.currentPassword`)}>
							<Input
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.currentTarget.value)}
								autoComplete="current-password"
								required
							/>
						</FormControl>

						<FormControl label={t(`${keyPrefix}.newPassword`)}>
							<Input
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.currentTarget.value)}
								autoComplete="new-password"
								required
							/>
						</FormControl>

						<FormControl label={t(`${keyPrefix}.confirmPassword`)}>
							<Input
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.currentTarget.value)}
								autoComplete="new-password"
								required
							/>
						</FormControl>

						<Button type="submit" isLoading={changingPassword}>
							{t(`${keyPrefix}.updatePassword`)}
						</Button>
					</form>
				</>
			)}
		</div>
	);
}
