import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useI18n } from "../../context/I18nContext";
import AppointmentsFilterSection from "./components/AppointmentsFilterSection";
import AppointmentsHeader from "./components/AppointmentsHeader";
import AppointmentsListSection from "./components/AppointmentsListSection";
import {
	canDeleteAppointment,
	isPastAppointment,
	useAppointmentsPage,
} from "./hooks/useAppointmentsPage";

export default function AppointmentsPage() {
	const { t, locale } = useI18n();
	const {
		filteredAppointments,
		handleCancel,
		handleDelete,
		setStatusFilter,
		statusFilter,
	} = useAppointmentsPage(t);

	const formatDate = (d: string) =>
		new Date(d).toLocaleString(locale, {
			dateStyle: "medium",
			timeStyle: "short",
		});

	return (
		<div>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

			<AppointmentsHeader title={t("appointments.title")} />

			<AppointmentsFilterSection
				statusFilter={statusFilter}
				onChange={setStatusFilter}
				t={t}
			/>

			<AppointmentsListSection
				appointments={filteredAppointments}
				formatDate={formatDate}
				onCancel={handleCancel}
				onDelete={handleDelete}
				isPastAppointment={isPastAppointment}
				canDeleteAppointment={canDeleteAppointment}
				t={t}
			/>
		</div>
	);
}
