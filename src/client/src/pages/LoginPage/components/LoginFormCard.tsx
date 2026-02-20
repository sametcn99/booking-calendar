import { useStyletron } from "baseui";

interface Props {
	children: React.ReactNode;
	onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function LoginFormCard({ children, onSubmit }: Props) {
	const [css] = useStyletron();

	return (
		<form
			onSubmit={onSubmit}
			className={css({
				width: "100%",
				maxWidth: "400px",
				padding: "40px",
				backgroundColor: "#141414",
				borderRadius: "12px",
				border: "1px solid #2a2a2a",
			})}
		>
			{children}
		</form>
	);
}
