import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import type { AppointmentStatusFilter } from "../hooks/useAppointmentsPage";

interface Props {
	statusFilter: AppointmentStatusFilter;
	onChange: (value: AppointmentStatusFilter) => void;
	pendingCount: number;
	t: (key: string) => string;
}

export default function StatusFilterButtons({
	statusFilter,
	onChange,
	pendingCount,
	t,
}: Props) {
	const [css] = useStyletron();
	return (
		<>
			<Button
				kind={statusFilter === "all" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("all")}
			>
				{t("appointments.all")}
			</Button>
			<Button
				kind={statusFilter === "active" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("active")}
			>
				{t("appointments.active")}
			</Button>
			<Button
				kind={statusFilter === "pending" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("pending")}
			>
				<span
					className={css({ display: "flex", alignItems: "center", gap: "6px" })}
				>
					{t("appointments.pendingApproval")}
					{pendingCount > 0 && (
						<span
							className={css({
								backgroundColor:
									statusFilter === "pending"
										? "rgba(255,255,255,0.3)"
										: "var(--color-warning-dark-bg)",
								color:
									statusFilter === "pending"
										? "white"
										: "var(--color-warning-light)",
								borderRadius: "10px",
								padding: "1px 7px",
								fontSize: "11px",
								fontWeight: 700,
								lineHeight: "1.6",
							})}
						>
							{pendingCount}
						</span>
					)}
				</span>
			</Button>
			<Button
				kind={statusFilter === "canceled" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("canceled")}
			>
				{t("appointments.canceled")}
			</Button>
			<Button
				kind={statusFilter === "rejected" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("rejected")}
			>
				{t("appointments.rejected")}
			</Button>
			<Button
				kind={statusFilter === "past" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("past")}
			>
				{t("appointments.past")}
			</Button>
		</>
	);
}
