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
					color: "#e0d6f0",
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
						border: "1px solid #3d1f6a",
						backgroundColor: "#131021",
					})}
				>
					<div
						className={css({
							fontSize: "13px",
							fontWeight: 600,
							color: "#b8a9d4",
							marginBottom: "8px",
						})}
					>
						{t("booking.occupiedTimes")}
					</div>

					{selectedSlotBusyIntervals.length === 0 ? (
						<div className={css({ color: "#8b7aab", fontSize: "13px" })}>
							{t("booking.noOccupiedTimes")}
						</div>
					) : (
						<div className={css({ display: "grid", gap: "6px" })}>
							{selectedSlotBusyIntervals.map((interval) => (
								<div
									key={`${interval.start_at}-${interval.end_at}`}
									className={css({ color: "#e0d6f0", fontSize: "13px" })}
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
