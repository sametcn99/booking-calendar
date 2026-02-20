import { useStyletron } from "baseui";
import type { BusyInterval, Slot } from "../hooks/useBookingPage";
import SlotSelector from "./SlotSelector";

interface Props {
	formatDate: (date: string) => string;
	onSelect: (slot: Slot) => void;
	selectedSlotBusyIntervals: BusyInterval[];
	selectedSlot: number | null;
	slots: Slot[];
	t: (key: string) => string;
}

export default function BookingSlotsSection({
	formatDate,
	onSelect,
	selectedSlotBusyIntervals,
	selectedSlot,
	slots,
	t,
}: Props) {
	const [css] = useStyletron();

	return (
		<div className={css({ marginBottom: "32px" })}>
			<h2
				className={css({
					fontSize: "16px",
					fontWeight: 600,
					color: "var(--color-text-primary)",
					marginBottom: "12px",
				})}
			>
				{t("booking.availableTimes")}
			</h2>
			<SlotSelector
				slots={slots}
				selectedSlot={selectedSlot}
				onSelect={onSelect}
				formatDate={formatDate}
				t={t}
			/>

			{selectedSlot !== null && (
				<div
					className={css({
						marginTop: "16px",
						padding: "14px",
						borderRadius: "10px",
						border: "1px solid var(--color-accent-300)",
						backgroundColor: "var(--color-bg-secondary)",
					})}
				>
					<div
						className={css({
							fontSize: "13px",
							fontWeight: 600,
							color: "var(--color-text-secondary)",
							marginBottom: "8px",
						})}
					>
						{t("booking.occupiedTimes")}
					</div>

					{selectedSlotBusyIntervals.length === 0 ? (
						<div
							className={css({
								color: "var(--color-text-tertiary)",
								fontSize: "13px",
							})}
						>
							{t("booking.noOccupiedTimes")}
						</div>
					) : (
						<div className={css({ display: "grid", gap: "6px" })}>
							{selectedSlotBusyIntervals.map((interval) => (
								<div
									key={`${interval.start_at}-${interval.end_at}`}
									className={css({
										color: "var(--color-text-primary)",
										fontSize: "13px",
									})}
								>
									{formatDate(interval.start_at)} -{" "}
									{formatDate(interval.end_at)}
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
