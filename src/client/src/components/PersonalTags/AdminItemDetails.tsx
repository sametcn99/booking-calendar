import {
	Modal,
	ModalBody,
	ModalButton,
	ModalFooter,
	ModalHeader,
} from "baseui/modal";
import { useId } from "react";
import type {
	ApiAppointment,
	ApiCommunityEvent,
	ApiPlannerEvent,
	ApiSlot,
} from "../../api";
import { useI18n } from "../../context/I18nContext";
import { ItemTags } from "./TagPicker";

export type AdminItem =
	| { type: "appointment"; data: ApiAppointment }
	| { type: "community"; data: ApiCommunityEvent }
	| { type: "planner"; data: ApiPlannerEvent }
	| { type: "slot"; data: ApiSlot };

export default function AdminItemDetails({
	item,
	title,
	onClose,
}: {
	item: AdminItem;
	title: string;
	onClose: () => void;
}) {
	const { t, locale } = useI18n();
	const titleId = useId();
	const format = new Intl.DateTimeFormat(locale, {
		dateStyle: "medium",
		timeStyle: "short",
	});
	const formatDate = (date: string | null) => {
		const parsed = date ? new Date(date) : null;
		return parsed && Number.isFinite(parsed.getTime())
			? format.format(parsed)
			: "–";
	};
	const data = item.data;

	return (
		<Modal
			isOpen
			onClose={onClose}
			overrides={{
				Dialog: {
					props: { "aria-labelledby": titleId, "aria-label": undefined },
					style: { width: "min(520px, calc(100vw - 24px))" },
				},
			}}
		>
			<ModalHeader id={titleId}>{title}</ModalHeader>
			<ModalBody>
				{item.type === "appointment" && (
					<>
						{item.data.email && (
							<p>
								<strong>{t("dashboard.calendar.email")}</strong>{" "}
								{item.data.email}
							</p>
						)}
						{item.data.meeting_place && (
							<p>
								<strong>{t("appointments.meetingPlace")}</strong>{" "}
								{item.data.meeting_place}
							</p>
						)}
						{item.data.note && (
							<p>
								<strong>{t("dashboard.calendar.note")}</strong> {item.data.note}
							</p>
						)}
					</>
				)}
				{(item.type === "community" || item.type === "planner") &&
					item.data.description && <p>{item.data.description}</p>}
				{item.type === "community" && (
					<p>
						<strong>{t("communityEvents.approvals")}</strong>{" "}
						{item.data.current_approvals} / {item.data.required_approvals}
					</p>
				)}
				<p>
					<strong>{t("dashboard.calendar.timeLabel")}</strong>{" "}
					{formatDate(data.start_at)} – {formatDate(data.end_at)}
				</p>
				{item.type !== "slot" && (
					<ItemTags
						item={{ kind: item.type, itemId: data.id }}
						label={title}
						inline
					/>
				)}
			</ModalBody>
			<ModalFooter>
				<ModalButton onClick={onClose}>
					{t("dashboard.calendar.close")}
				</ModalButton>
			</ModalFooter>
		</Modal>
	);
}
