import { useStyletron } from "baseui";

interface Props {
	children: React.ReactNode;
}

export default function LoginPageLayout({ children }: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				backgroundColor: "var(--color-bg-primary)",
			})}
		>
			{children}
		</div>
	);
}
