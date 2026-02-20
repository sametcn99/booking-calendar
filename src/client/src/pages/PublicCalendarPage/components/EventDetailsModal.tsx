import {
	Modal,
	ModalBody,
	ModalButton,
	ModalFooter,
	ModalHeader,
} from "baseui/modal";
import type {
	ApiAppointment,
	ApiCommunityEvent,
	ApiPlannerEvent,
} from "../../../api";
import type { CalendarEvent } from "../types";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	selectedEvent: CalendarEvent | null;
	t: (key: string) => string;
}

export default function EventDetailsModal({
	isOpen,
	onClose,
	selectedEvent,
	t,
}: Props) {
	return (
		<Modal
			onClose={onClose}
			isOpen={isOpen}
			overrides={{
				Root: {
					style: {
						zIndex: 2000,
					},
				},
			}}
		>
			<ModalHeader>{selectedEvent?.title}</ModalHeader>
			<ModalBody>
				{selectedEvent?.type === "appointment" && (
					<div>
						<p>
							<strong>{t("dashboard.calendar.name")}:</strong>{" "}
							{(selectedEvent.data as ApiAppointment).name}
						</p>
						<p>
							<strong>{t("dashboard.calendar.email")}:</strong>{" "}
							{(selectedEvent.data as ApiAppointment).email || "-"}
						</p>
						<p>
							<strong>{t("dashboard.calendar.note")}:</strong>{" "}
							{(selectedEvent.data as ApiAppointment).note || "-"}
						</p>
						<p>
							<strong>{t("dashboard.calendar.timeLabel")}:</strong>{" "}
							{selectedEvent.start.toLocaleString()} -{" "}
							{selectedEvent.end.toLocaleString()}
						</p>
					</div>
				)}
				{selectedEvent?.type === "slot" && (
					<div>
						<p>
							<strong>{t("dashboard.calendar.status")}:</strong>{" "}
							{t("dashboard.calendar.availableSlot")}
						</p>
						<p>
							<strong>{t("dashboard.calendar.timeLabel")}:</strong>{" "}
							{selectedEvent.start.toLocaleString()} -{" "}
							{selectedEvent.end.toLocaleString()}
						</p>
					</div>
				)}
				{selectedEvent?.type === "planner" && (
					<div>
						<p>
							<strong>{t("planner.eventTitle")}:</strong>{" "}
							{(selectedEvent.data as ApiPlannerEvent).title}
						</p>
						{(selectedEvent.data as ApiPlannerEvent).description && (
							<p>
								<strong>{t("planner.description")}:</strong>{" "}
								{(selectedEvent.data as ApiPlannerEvent).description}
							</p>
						)}
						<p>
							<strong>{t("dashboard.calendar.timeLabel")}:</strong>{" "}
							{selectedEvent.start.toLocaleString()} -{" "}
							{selectedEvent.end.toLocaleString()}
						</p>
					</div>
				)}
				{selectedEvent?.type === "community" && (
					<div>
						<p>
							<strong>{t("communityEvents.eventTitle")}:</strong>{" "}
							{(selectedEvent.data as ApiCommunityEvent).title}
						</p>
						{(selectedEvent.data as ApiCommunityEvent).description && (
							<p>
								<strong>{t("communityEvents.description")}:</strong>{" "}
								{(selectedEvent.data as ApiCommunityEvent).description}
							</p>
						)}
						<p>
							<strong>{t("communityEvents.approvals")}:</strong>{" "}
							{(selectedEvent.data as ApiCommunityEvent).current_approvals} /{" "}
							{(selectedEvent.data as ApiCommunityEvent).required_approvals}
						</p>
						<p>
							<strong>{t("dashboard.calendar.timeLabel")}:</strong>{" "}
							{selectedEvent.start.toLocaleString()} -{" "}
							{selectedEvent.end.toLocaleString()}
						</p>
					</div>
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
