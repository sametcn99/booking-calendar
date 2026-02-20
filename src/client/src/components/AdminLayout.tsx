import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import {
	Calendar,
	CalendarPlus,
	ChevronLeft,
	ChevronRight,
	Clock,
	LayoutDashboard,
	Link as LinkIcon,
	LogOut,
	Megaphone,
	Settings,
} from "lucide-react";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { NotificationToggle } from "./NotificationToggle";

export default function AdminLayout() {
	const [css] = useStyletron();
	const navigate = useNavigate();
	const location = useLocation();
	const { logout } = useAuth();
	const { t } = useI18n();
	const [isExpanded, setIsExpanded] = useState(false);

	const navItems = [
		{ label: t("nav.dashboard"), path: "/admin", icon: LayoutDashboard },
		{ label: t("nav.slots"), path: "/admin/slots", icon: Clock },
		{
			label: t("nav.appointments"),
			path: "/admin/appointments",
			icon: Calendar,
		},
		{ label: t("nav.links"), path: "/admin/links", icon: LinkIcon },
		{ label: t("nav.events"), path: "/admin/events", icon: Megaphone },
		{ label: t("nav.planner"), path: "/admin/planner", icon: CalendarPlus },
		{ label: t("nav.settings"), path: "/admin/settings", icon: Settings },
	];

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	return (
		<div
			className={css({
				display: "flex",
				height: "100vh",
				overflow: "hidden",
				backgroundColor: "#0a0a0a",
			})}
		>
			{/* Sidebar */}
			<nav
				className={css({
					width: "240px",
					height: "100%",
					backgroundColor: "#141414",
					borderRight: "1px solid #2a2a2a",
					padding: "24px 16px",
					display: "flex",
					flexDirection: "column",
					gap: "8px",
					flexShrink: 0,
					transition: "width 0.3s ease, padding 0.3s ease",
					position: "relative",
					zIndex: 20,
					"@media (max-width: 768px)": {
						width: "70px",
						padding: "24px 8px",
					},
				})}
			>
				{/* Back-drop for mobile expanded state */}
				{isExpanded && (
					<button
						type="button"
						aria-label="Close menu"
						onClick={() => setIsExpanded(false)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								setIsExpanded(false);
							}
						}}
						className={css({
							display: "none",
							"@media (max-width: 768px)": {
								display: "block",
								position: "fixed",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								backgroundColor: "rgba(0, 0, 0, 0.5)",
								zIndex: -1,
								border: "none",
								padding: 0,
								width: "100%",
								height: "100%",
								cursor: "pointer",
							},
						})}
					/>
				)}

				{/* Inner container that actually expands on mobile */}
				<div
					className={css({
						height: "100%",
						display: "flex",
						flexDirection: "column",
						width: "100%",
						"@media (max-width: 768px)": {
							position: "absolute",
							top: 0,
							left: 0,
							width: isExpanded ? "240px" : "70px",
							backgroundColor: "#141414",
							height: "100%",
							padding: isExpanded ? "24px 16px" : "24px 8px",
							transition: "width 0.3s ease, padding 0.3s ease",
							borderRight: isExpanded ? "1px solid #2a2a2a" : "none",
							boxShadow: isExpanded
								? "10px 0 15px -3px rgba(0, 0, 0, 0.5)"
								: "none",
						},
					})}
				>
					<div
						className={css({
							fontSize: "20px",
							fontWeight: 700,
							color: "#a78bfa",
							marginBottom: "32px",
							textAlign: "center",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							minHeight: "40px",
							flexShrink: 0,
							"@media (max-width: 768px)": {
								fontSize: "14px",
							},
						})}
					>
						<span
							className={css({
								"@media (max-width: 768px)": {
									display: isExpanded ? "block" : "none",
								},
							})}
						>
							{t("app.title")}
						</span>
						<span
							className={css({
								display: "none",
								"@media (max-width: 768px)": {
									display: isExpanded ? "none" : "block",
								},
							})}
						>
							{t("app.titleShort")}
						</span>
					</div>

					<div
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "8px",
							flex: 1,
							overflowY: "auto",
							scrollbarWidth: "none",
							"::-webkit-scrollbar": { display: "none" },
						})}
					>
						{navItems.map((Item) => (
							<Button
								key={Item.path}
								kind={
									location.pathname === Item.path
										? KIND.primary
										: KIND.secondary
								}
								size={SIZE.compact}
								onClick={() => {
									navigate(Item.path);
									if (isExpanded) setIsExpanded(false);
								}}
								overrides={{
									BaseButton: {
										style: {
											width: "100%",
											justifyContent: "flex-start",
											paddingLeft: "12px",
											paddingRight: "12px",
											flexShrink: 0,
											"@media (max-width: 768px)": {
												justifyContent: isExpanded ? "flex-start" : "center",
												paddingLeft: isExpanded ? "12px" : "0",
												paddingRight: isExpanded ? "12px" : "0",
											},
										},
									},
								}}
							>
								<Item.icon size={20} />
								<span
									className={css({
										marginLeft: "12px",
										"@media (max-width: 768px)": {
											display: isExpanded ? "block" : "none",
										},
									})}
								>
									{Item.label}
								</span>
							</Button>
						))}

						<div className={css({ flex: 1 })} />

						<NotificationToggle isExpanded={isExpanded} />
						<div className={css({ height: "8px" })} />

						<Button
							kind={KIND.tertiary}
							size={SIZE.compact}
							onClick={() => {
								handleLogout();
								if (isExpanded) setIsExpanded(false);
							}}
							overrides={{
								BaseButton: {
									style: {
										width: "100%",
										color: "#b8a9d4",
										justifyContent: "flex-start",
										paddingLeft: "12px",
										paddingRight: "12px",
										flexShrink: 0,
										"@media (max-width: 768px)": {
											justifyContent: isExpanded ? "flex-start" : "center",
											paddingLeft: isExpanded ? "12px" : "0",
											paddingRight: isExpanded ? "12px" : "0",
										},
									},
								},
							}}
						>
							<LogOut size={20} />
							<span
								className={css({
									marginLeft: "12px",
									"@media (max-width: 768px)": {
										display: isExpanded ? "block" : "none",
									},
								})}
							>
								{t("nav.logout")}
							</span>
						</Button>
					</div>

					{/* Expand/Collapse Toggle for Mobile Only */}
					<div
						className={css({
							display: "none",
							flexShrink: 0,
							"@media (max-width: 768px)": {
								display: "flex",
								justifyContent: "center",
								paddingTop: "16px",
								borderTop: "1px solid #2a2a2a",
								marginTop: "16px",
							},
						})}
					>
						<Button
							kind={KIND.tertiary}
							size={SIZE.mini}
							onClick={() => setIsExpanded(!isExpanded)}
							overrides={{
								BaseButton: {
									style: {
										width: "100%",
										display: "flex",
										justifyContent: "center",
									},
								},
							}}
						>
							{isExpanded ? (
								<ChevronLeft size={20} />
							) : (
								<ChevronRight size={20} />
							)}
						</Button>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main
				className={css({
					flex: 1,
					height: "100%",
					padding: "32px",
					overflowY: "auto",
					"@media (max-width: 768px)": {
						padding: "16px",
					},
				})}
			>
				<Outlet />
			</main>
		</div>
	);
}
