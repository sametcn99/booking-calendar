import { useStyletron } from "baseui";
import { Button } from "baseui/button";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";

interface Props {
	adminEmail: string;
	onSubmit: (event: React.FormEvent) => void;
	savingAdminEmail: boolean;
	setAdminEmail: (value: string) => void;
	t: (key: string) => string;
	keyPrefix?: string;
	surface?: "card" | "list";
}

export default function AdminEmailSection({
	adminEmail,
	onSubmit,
	savingAdminEmail,
	setAdminEmail,
	t,
	keyPrefix = "dashboard",
	surface = "card",
}: Props) {
	const [css] = useStyletron();
	const isList = surface === "list";

	return (
		<div
			className={css({
				backgroundColor: "#141414",
				borderRadius: isList ? "10px" : "12px",
				padding: isList ? "18px" : "24px",
				border: "1px solid #2a2a2a",
			})}
		>
			<h2
				className={css({
					fontSize: "18px",
					fontWeight: 700,
					color: "#e0d6f0",
					marginBottom: "12px",
				})}
			>
				{t(`${keyPrefix}.adminEmail`)}
			</h2>
			<div
				className={css({
					fontSize: "13px",
					color: "#b8a9d4",
					marginBottom: "14px",
				})}
			>
				{t(`${keyPrefix}.adminEmailDescription`)}
			</div>

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

				<Button type="submit" isLoading={savingAdminEmail}>
					{t(`${keyPrefix}.saveAdminEmail`)}
				</Button>
			</form>
		</div>
	);
}
