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
					backgroundColor: "var(--color-bg-secondary)",
					borderRadius: "8px",
					color: "var(--color-text-tertiary)",
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
							background:
								selectedSlot === slot.id
									? "var(--color-accent-300)"
									: "var(--color-bg-tertiary)",
							border:
								selectedSlot === slot.id
									? "2px solid var(--color-accent-600)"
									: "1px solid var(--color-accent-300)",
							borderRadius: "10px",
							padding: "16px 18px",
							color: disabled
								? "var(--color-text-disabled)"
								: "var(--color-text-primary)",
							cursor: disabled ? "not-allowed" : "pointer",
							opacity: disabled ? 0.7 : 1,
							textAlign: "left",
							fontSize: "15px",
							transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
							boxShadow: "0 2px 4px color-mix(in srgb, black 10%, transparent)",
							":hover": disabled
								? {}
								: {
										backgroundColor: "var(--color-bg-quaternary)",
										borderColor: "var(--color-accent-600)",
										transform: "translateY(-2px)",
										boxShadow:
											"0 4px 12px color-mix(in srgb, var(--color-accent-600) 20%, transparent)",
									},
						})}
					>
						<div className={css({ fontWeight: 600 })}>
							{formatDate(slot.start_at)}
						</div>
						<div
							className={css({
								color: disabled
									? "var(--color-text-disabled-alt)"
									: "var(--color-text-tertiary)",
								fontSize: "13px",
								marginTop: "2px",
							})}
						>
							- {formatDate(slot.end_at)}
						</div>
						{disabled && (
							<div
								className={css({
									color: "var(--color-error-text)",
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
