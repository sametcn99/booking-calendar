import { useStyletron } from "baseui";

interface Props {
	t: (key: string) => string;
}

const navigationItems = [
	{ id: "language", labelKey: "settings.language" },
	{ id: "password", labelKey: "settings.changePassword" },
	{ id: "admin-email", labelKey: "settings.adminEmail" },
	{ id: "calendar-sharing", labelKey: "settings.calendarSharing" },
	{ id: "push", labelKey: "settings.pushNotifications" },
	{ id: "email", labelKey: "settings.emailNotifications" },
	{ id: "webhook", labelKey: "settings.webhook" },
	{ id: "version", labelKey: "settings.version" },
	{ id: "theme-colors", labelKey: "settings.themeColors" },
	{ id: "ics", labelKey: "settings.icsExport" },
] as const;

export default function SettingsPageSidebar({ t }: Props) {
	const [css] = useStyletron();

	return (
		<aside
			className={css({
				display: "none",
				"@media screen and (min-width: 1100px)": {
					display: "block",
					position: "sticky",
					top: "24px",
					alignSelf: "start",
				},
			})}
		>
			<div
				className={css({
					padding: "14px",
					borderRadius: "10px",
					border: "1px solid var(--color-bg-quaternary)",
					backgroundColor: "var(--color-bg-secondary)",
				})}
			>
				<div
					className={css({
						fontSize: "12px",
						textTransform: "uppercase",
						letterSpacing: "0.04em",
						fontWeight: 700,
						color: "var(--color-text-subtle)",
						marginBottom: "10px",
					})}
				>
					{t("settings.title")}
				</div>
				<nav
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "8px",
					})}
				>
					{navigationItems.map((item) => (
						<a
							key={item.id}
							href={`#${item.id}`}
							className={css({
								fontSize: "13px",
								fontWeight: 500,
								color: "var(--color-text-secondary)",
								padding: "7px 10px",
								borderRadius: "8px",
								border: "1px solid transparent",
								textDecoration: "none",
								":hover": {
									backgroundColor: "var(--color-bg-tertiary)",
									borderColor: "var(--color-bg-quaternary)",
								},
							})}
						>
							{t(item.labelKey)}
						</a>
					))}
				</nav>
			</div>
		</aside>
	);
}
