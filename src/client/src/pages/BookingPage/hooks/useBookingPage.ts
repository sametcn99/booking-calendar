import { toaster } from "baseui/toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../api";

export interface BusyInterval {
	start_at: string;
	end_at: string;
}

export interface Slot {
	id: number;
	start_at: string;
	end_at: string;
	busy_intervals: BusyInterval[];
}

function toLocalDateTimeInputValue(iso: string): string {
	const date = new Date(iso);
	const tzOffset = date.getTimezoneOffset() * 60_000;
	return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function localDateTimeInputToIso(value: string): string {
	return new Date(value).toISOString();
}

function hasOverlap(
	startIso: string,
	endIso: string,
	busyIntervals: BusyInterval[],
): boolean {
	if (!startIso || !endIso || new Date(endIso) <= new Date(startIso)) {
		return false;
	}

	return busyIntervals.some((interval) => {
		return !(
			new Date(endIso) <= new Date(interval.start_at) ||
			new Date(startIso) >= new Date(interval.end_at)
		);
	});
}

function getFreeIntervals(slot: Slot): BusyInterval[] {
	const sortedBusy = [...slot.busy_intervals]
		.filter(
			(interval) => new Date(interval.end_at) > new Date(interval.start_at),
		)
		.sort(
			(a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
		);

	const slotStart = new Date(slot.start_at).getTime();
	const slotEnd = new Date(slot.end_at).getTime();
	const free: BusyInterval[] = [];
	let cursor = slotStart;

	for (const interval of sortedBusy) {
		const busyStart = Math.max(
			new Date(interval.start_at).getTime(),
			slotStart,
		);
		const busyEnd = Math.min(new Date(interval.end_at).getTime(), slotEnd);

		if (busyEnd <= busyStart) {
			continue;
		}

		if (cursor < busyStart) {
			free.push({
				start_at: new Date(cursor).toISOString(),
				end_at: new Date(busyStart).toISOString(),
			});
		}

		cursor = Math.max(cursor, busyEnd);
	}

	if (cursor < slotEnd) {
		free.push({
			start_at: new Date(cursor).toISOString(),
			end_at: new Date(slotEnd).toISOString(),
		});
	}

	return free;
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

export function useBookingPage(
	slugId: string | undefined,
	t: (key: string) => string,
) {
	const [valid, setValid] = useState<boolean | null>(null);
	const [slots, setSlots] = useState<Slot[]>([]);
	const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [meetingPlace, setMeetingPlace] = useState("");
	const [note, setNote] = useState("");
	const [selectedStartAt, setSelectedStartAt] = useState("");
	const [selectedEndAt, setSelectedEndAt] = useState("");
	const [loading, setLoading] = useState(false);
	const [createdAppointmentToken, setCreatedAppointmentToken] = useState<
		string | null
	>(null);

	const selectedSlotData = useMemo(() => {
		if (!selectedSlot) return null;
		return slots.find((slot) => slot.id === selectedSlot) || null;
	}, [selectedSlot, slots]);

	const selectedSlotBusyIntervals = useMemo(() => {
		return selectedSlotData?.busy_intervals ?? [];
	}, [selectedSlotData]);

	const validateAndLoad = useCallback(async () => {
		if (!slugId) {
			setValid(false);
			return;
		}

		try {
			await api.validateToken(slugId);
			setValid(true);
			const result = await api.getAvailableSlots(slugId);
			setSlots(result.data);
		} catch {
			setValid(false);
		}
	}, [slugId]);

	useEffect(() => {
		if (slugId) validateAndLoad();
	}, [slugId, validateAndLoad]);

	const selectSlot = useCallback(
		(slot: Slot) => {
			const freeIntervals = getFreeIntervals(slot);
			if (freeIntervals.length === 0) {
				toaster.negative(t("booking.slotFullyOccupied"), {});
				return;
			}

			setSelectedSlot(slot.id);
			setSelectedStartAt(toLocalDateTimeInputValue(freeIntervals[0].start_at));
			setSelectedEndAt(toLocalDateTimeInputValue(freeIntervals[0].end_at));
		},
		[t],
	);

	const setSelectedStartAtSafe = useCallback(
		(value: string) => {
			if (!selectedSlotData || !value || !selectedEndAt) {
				setSelectedStartAt(value);
				return;
			}

			const startIso = localDateTimeInputToIso(value);
			const endIso = localDateTimeInputToIso(selectedEndAt);
			if (hasOverlap(startIso, endIso, selectedSlotData.busy_intervals)) {
				toaster.negative(t("booking.overlapOccupied"), {});
				return;
			}

			setSelectedStartAt(value);
		},
		[selectedEndAt, selectedSlotData, t],
	);

	const setSelectedEndAtSafe = useCallback(
		(value: string) => {
			if (!selectedSlotData || !value || !selectedStartAt) {
				setSelectedEndAt(value);
				return;
			}

			const startIso = localDateTimeInputToIso(selectedStartAt);
			const endIso = localDateTimeInputToIso(value);
			if (hasOverlap(startIso, endIso, selectedSlotData.busy_intervals)) {
				toaster.negative(t("booking.overlapOccupied"), {});
				return;
			}

			setSelectedEndAt(value);
		},
		[selectedSlotData, selectedStartAt, t],
	);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!selectedSlot || !name || !selectedStartAt || !selectedEndAt) {
				toaster.negative(t("booking.requiredFields"), {});
				return;
			}

			if (!selectedSlotData) {
				toaster.negative(t("booking.slotNotFound"), {});
				return;
			}

			const startIso = localDateTimeInputToIso(selectedStartAt);
			const endIso = localDateTimeInputToIso(selectedEndAt);
			const slotStartIso = selectedSlotData.start_at;
			const slotEndIso = selectedSlotData.end_at;

			if (new Date(endIso) <= new Date(startIso)) {
				toaster.negative(t("booking.endAfterStart"), {});
				return;
			}

			if (
				new Date(startIso) < new Date(slotStartIso) ||
				new Date(endIso) > new Date(slotEndIso)
			) {
				toaster.negative(t("booking.outsideSlot"), {});
				return;
			}

			if (hasOverlap(startIso, endIso, selectedSlotData.busy_intervals)) {
				toaster.negative(t("booking.overlapOccupied"), {});
				return;
			}

			setLoading(true);
			try {
				if (!slugId) {
					setValid(false);
					return;
				}

				const result = await api.createAppointment(slugId, {
					slot_id: selectedSlot,
					name,
					email: email || undefined,
					meeting_place: meetingPlace || undefined,
					note: note || undefined,
					start_at: startIso,
					end_at: endIso,
				});
				setCreatedAppointmentToken(result.data.slug_id);
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			} finally {
				setLoading(false);
			}
		},
		[
			email,
			meetingPlace,
			name,
			note,
			selectedEndAt,
			selectedSlot,
			selectedSlotData,
			selectedStartAt,
			t,
			slugId,
		],
	);

	return {
		email,
		handleSubmit,
		loading,
		meetingPlace,
		name,
		note,
		selectedEndAt,
		selectedSlot,
		selectedSlotBusyIntervals,
		selectedStartAt,
		selectSlot,
		setEmail,
		setMeetingPlace,
		setName,
		setNote,
		setSelectedEndAt: setSelectedEndAtSafe,
		setSelectedStartAt: setSelectedStartAtSafe,
		slots,
		createdAppointmentToken,
		valid,
	};
}
