import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Checkbox } from "baseui/checkbox";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";
import {
	Modal,
	ModalBody,
	ModalButton,
	ModalFooter,
	ModalHeader,
} from "baseui/modal";
import { useCallback, useMemo, useState } from "react";
import type { ApiSlot } from "../../../api";

interface Props {
	expiresDays: string;
	generatedUrl: string;
	isOpen: boolean;
	linkName: string;
	loading: boolean;
	onClose: () => void;
	onCopyGeneratedUrl: () => void;
	onCreate: () => void;
	selectedSlotIds: number[];
	setExpiresDays: (value: string) => void;
	setLinkName: (value: string) => void;
	slots: ApiSlot[];
	t: (key: string) => string;
	locale: string;
	toggleSlotSelection: (slotId: number) => void;
}

export default function CreateLinkModal({
	expiresDays,
	generatedUrl,
	isOpen,
	linkName,
	loading,
	onClose,
	onCopyGeneratedUrl,
	onCreate,
	selectedSlotIds,
	setExpiresDays,
	setLinkName,
	slots,
	t,
	locale,
	toggleSlotSelection,
}: Props) {
	const [css] = useStyletron();
	const [slotQuery, setSlotQuery] = useState("");

	const parseSafeDate = useCallback((value: string): Date | null => {
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) {
			return null;
		}

		return parsed;
	}, []);

	const formatDate = useCallback(
		(value: string) => {
			const parsed = parseSafeDate(value);
			if (!parsed) return value;

			return parsed.toLocaleDateString(locale, {
				weekday: "short",
				day: "2-digit",
				month: "short",
				year: "numeric",
			});
		},
		[locale, parseSafeDate],
	);

	const formatTime = useCallback(
		(value: string) => {
			const parsed = parseSafeDate(value);
			if (!parsed) return value;

			return parsed.toLocaleTimeString(locale, {
				hour: "2-digit",
				minute: "2-digit",
			});
		},
		[locale, parseSafeDate],
	);

	const formatDateTimeRange = useCallback(
		(slot: ApiSlot) => {
			const startDateLabel = formatDate(slot.start_at);
			const endDateLabel = formatDate(slot.end_at);
			const startTimeLabel = formatTime(slot.start_at);
			const endTimeLabel = formatTime(slot.end_at);

			if (startDateLabel === endDateLabel) {
				return `${startDateLabel} ${startTimeLabel} - ${endTimeLabel}`;
			}

			return `${startDateLabel} ${startTimeLabel} - ${endDateLabel} ${endTimeLabel}`;
		},
		[formatDate, formatTime],
	);

	const normalizedQuery = slotQuery.trim().toLocaleLowerCase(locale);

	const visibleSlots = useMemo(() => {
		if (!normalizedQuery) return slots;

		return slots.filter((slot) => {
			const rangeLabel = formatDateTimeRange(slot)
				.toLocaleLowerCase(locale)
				.replace(/\s+/g, " ");

			return rangeLabel.includes(normalizedQuery);
		});
	}, [normalizedQuery, slots, locale, formatDateTimeRange]);

	const groupedVisibleSlots = useMemo(() => {
		const groups = new Map<string, ApiSlot[]>();

		for (const slot of visibleSlots) {
			const parsed = parseSafeDate(slot.start_at);
			const groupKey = parsed
				? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`
				: `invalid-${slot.id}`;
			const existing = groups.get(groupKey) || [];
			existing.push(slot);
			groups.set(groupKey, existing);
		}

		return Array.from(groups.entries()).map(([key, daySlots]) => ({
			dayKey: key,
			slots: daySlots,
		}));
	}, [visibleSlots, parseSafeDate]);

	const allVisibleSelected =
		visibleSlots.length > 0 &&
		visibleSlots.every((slot) => selectedSlotIds.includes(slot.id));

	const selectedVisibleCount = visibleSlots.filter((slot) =>
		selectedSlotIds.includes(slot.id),
	).length;

	const handleSelectAllVisible = () => {
		for (const slot of visibleSlots) {
			if (!selectedSlotIds.includes(slot.id)) {
				toggleSlotSelection(slot.id);
			}
		}
	};

	const handleClearVisible = () => {
		for (const slot of visibleSlots) {
			if (selectedSlotIds.includes(slot.id)) {
				toggleSlotSelection(slot.id);
			}
		}
	};

	const renderSlotLabel = useCallback(
		(slot: ApiSlot) => formatDateTimeRange(slot),
		[formatDateTimeRange],
	);

	return (
		<Modal
			onClose={onClose}
			isOpen={isOpen}
			overrides={{
				Dialog: {
					style: {
						backgroundColor: "var(--color-bg-secondary)",
						borderRadius: "12px",
					},
				},
			}}
		>
			<ModalHeader>{t("links.createTitle")}</ModalHeader>
			<ModalBody>
				{!generatedUrl ? (
					<div className={css({ display: "grid", gap: "12px" })}>
						<FormControl label={t("links.linkName")}>
							<Input
								value={linkName}
								placeholder={t("links.linkNamePlaceholder")}
								onChange={(e) => setLinkName(e.currentTarget.value)}
							/>
						</FormControl>

						<FormControl label={t("links.expiresInDays")}>
							<Input
								type="number"
								value={expiresDays}
								onChange={(e) => setExpiresDays(e.currentTarget.value)}
							/>
						</FormControl>

						<FormControl label={t("links.selectSlots")}>
							<div className={css({ display: "grid", gap: "8px" })}>
								<div
									className={css({
										display: "grid",
										gap: "8px",
										marginBottom: "8px",
									})}
								>
									<Input
										value={slotQuery}
										placeholder={t("links.searchSlotsPlaceholder")}
										onChange={(e) => setSlotQuery(e.currentTarget.value)}
									/>
									<div
										className={css({
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											gap: "8px",
											flexWrap: "wrap",
										})}
									>
										<div
											className={css({
												fontSize: "12px",
												color: "var(--color-text-faint)",
											})}
										>
											{t("links.selectedSummary")}: {selectedSlotIds.length} /{" "}
											{slots.length}
										</div>
										<div className={css({ display: "flex", gap: "6px" })}>
											<Button
												kind={KIND.secondary}
												size={SIZE.mini}
												onClick={
													allVisibleSelected
														? handleClearVisible
														: handleSelectAllVisible
												}
											>
												{allVisibleSelected
													? t("links.clearVisible")
													: t("links.selectVisible")}
											</Button>
										</div>
									</div>
								</div>

								<div
									className={css({
										display: "grid",
										gap: "10px",
										maxHeight: "260px",
										overflowY: "auto",
										padding: "10px",
										borderRadius: "8px",
										border: "1px solid var(--color-bg-quaternary)",
										backgroundColor: "var(--color-bg-off-range)",
									})}
								>
									{visibleSlots.length === 0 && (
										<div
											className={css({
												textAlign: "center",
												padding: "18px 12px",
												fontSize: "13px",
												color: "var(--color-text-tertiary)",
											})}
										>
											{slotQuery
												? t("links.noFilteredSlots")
												: t("links.noActiveSlots")}
										</div>
									)}

									{visibleSlots.length > 0 &&
										groupedVisibleSlots.map((group) => (
											<div
												key={group.dayKey}
												className={css({ display: "grid", gap: "6px" })}
											>
												{group.slots.map((slot) => {
													const checked = selectedSlotIds.includes(slot.id);
													return (
														<div
															key={slot.id}
															className={css({
																borderRadius: "8px",
																border: checked
																	? "1px solid var(--color-accent-500)"
																	: "1px solid var(--color-border-primary)",
																backgroundColor: checked
																	? "var(--color-accent-100)"
																	: "var(--color-bg-secondary)",
																padding: "8px 10px",
															})}
														>
															<Checkbox
																checked={checked}
																onChange={() => toggleSlotSelection(slot.id)}
															>
																{renderSlotLabel(slot)}
															</Checkbox>
														</div>
													);
												})}
											</div>
										))}
								</div>
								{visibleSlots.length > 0 && (
									<div
										className={css({
											fontSize: "12px",
											color: "var(--color-text-tertiary)",
											marginTop: "6px",
										})}
									>
										{t("links.visibleSelection")}: {selectedVisibleCount} /{" "}
										{visibleSlots.length}
									</div>
								)}
							</div>
						</FormControl>
					</div>
				) : (
					<div>
						<div
							className={css({
								fontSize: "14px",
								color: "var(--color-text-secondary)",
								marginBottom: "8px",
							})}
						>
							{t("links.shareLink")}
						</div>
						<div
							className={css({
								backgroundColor: "var(--color-bg-tertiary)",
								padding: "12px",
								borderRadius: "8px",
								fontFamily: "monospace",
								fontSize: "13px",
								wordBreak: "break-all",
								color: "var(--color-accent-800)",
							})}
						>
							{generatedUrl}
						</div>
						<Button
							kind={KIND.secondary}
							size={SIZE.compact}
							onClick={onCopyGeneratedUrl}
							overrides={{
								BaseButton: { style: { marginTop: "12px", width: "100%" } },
							}}
						>
							{t("links.copyLink")}
						</Button>
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<ModalButton kind={KIND.tertiary} onClick={onClose}>
					{t("links.close")}
				</ModalButton>
				{!generatedUrl && (
					<ModalButton onClick={onCreate} isLoading={loading}>
						{t("links.create")}
					</ModalButton>
				)}
			</ModalFooter>
		</Modal>
	);
}
