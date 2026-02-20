import { useStyletron } from "baseui";
import type { Slot } from "../hooks/useBookingPage";

interface Props {
	slots: Slot[];
	selectedSlot: number | null;
	onSelect: (slot: Slot) => void;
	formatDate: (date: string) => string;
	t: (key: string) => string;
}

export default function SlotSelector({
	slots,
	selectedSlot,
	onSelect,
	formatDate,
	t,
}: Props) {
	const [css] = useStyletron();

	const isFullyOccupied = (slot: Slot) => {
		const slotStart = new Date(slot.start_at).getTime();
		const slotEnd = new Date(slot.end_at).getTime();
		if (slotEnd <= slotStart) return true;

		const intervals = [...slot.busy_intervals]
			.filter(
				(interval) => new Date(interval.end_at) > new Date(interval.start_at),
			)
			.sort(
				(a, b) =>
					new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
			);

		let coveredUntil = slotStart;
		for (const interval of intervals) {
			const busyStart = Math.max(
				new Date(interval.start_at).getTime(),
				slotStart,
			);
			const busyEnd = Math.min(new Date(interval.end_at).getTime(), slotEnd);
			if (busyEnd <= busyStart) continue;

			if (busyStart > coveredUntil) {
				return false;
			}

			coveredUntil = Math.max(coveredUntil, busyEnd);
			if (coveredUntil >= slotEnd) {
				return true;
			}
		}

		return coveredUntil >= slotEnd;
	};

	if (slots.length === 0) {
		return (
			<div
				className={css({
					textAlign: "center",
					padding: "32px",
					backgroundColor: "#141414",
					borderRadius: "8px",
					color: "#8b7aab",
				})}
			>
				{t("booking.noSlots")}
			</div>
		);
	}

	return (
		<div className={css({ display: "grid", gap: "8px" })}>
			{slots.map((slot) => {
				const disabled = isFullyOccupied(slot);
				return (
					<button
						key={slot.id}
						type="button"
						onClick={() => onSelect(slot)}
						disabled={disabled}
						className={css({
							background: selectedSlot === slot.id ? "#4c1d95" : "#1e1e1e",
							border:
								selectedSlot === slot.id
									? "2px solid #7c3aed"
									: "1px solid #4c1d95",
							borderRadius: "10px",
							padding: "16px 18px",
							color: disabled ? "#75678f" : "#e0d6f0",
							cursor: disabled ? "not-allowed" : "pointer",
							opacity: disabled ? 0.7 : 1,
							textAlign: "left",
							fontSize: "15px",
							transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
							boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
							":hover": disabled
								? {}
								: {
										backgroundColor: "#2a2a2a",
										borderColor: "#7c3aed",
										transform: "translateY(-2px)",
										boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
									},
						})}
					>
						<div className={css({ fontWeight: 600 })}>
							{formatDate(slot.start_at)}
						</div>
						<div
							className={css({
								color: disabled ? "#6d6282" : "#8b7aab",
								fontSize: "13px",
								marginTop: "2px",
							})}
						>
							- {formatDate(slot.end_at)}
						</div>
						{disabled && (
							<div
								className={css({
									color: "#fca5a5",
									fontSize: "12px",
									marginTop: "8px",
								})}
							>
								{t("booking.slotFullyOccupied")}
							</div>
						)}
					</button>
				);
			})}
		</div>
	);
}
