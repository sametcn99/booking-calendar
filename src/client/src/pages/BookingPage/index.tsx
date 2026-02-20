import { useStyletron } from "baseui";
import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";
import BookingFormSection from "./components/BookingFormSection";
import BookingHeader from "./components/BookingHeader";
import BookingInvalidState from "./components/BookingInvalidState";
import BookingLoadingState from "./components/BookingLoadingState";
import BookingSlotsSection from "./components/BookingSlotsSection";
import { useBookingPage } from "./hooks/useBookingPage";

export default function BookingPage() {
	const [css] = useStyletron();
	const navigate = useNavigate();
	const { t, locale } = useI18n();
	const { token } = useParams<{ token: string }>();
	const {
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
		setSelectedEndAt,
		setSelectedStartAt,
		slots,
		createdAppointmentToken,
		valid,
	} = useBookingPage(token, t);

	useEffect(() => {
		if (!createdAppointmentToken) return;
		navigate(`/appointment/${createdAppointmentToken}`, { replace: true });
	}, [createdAppointmentToken, navigate]);

	const formatDate = (d: string) =>
		new Date(d).toLocaleString(locale, {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

	// Loading state
	if (valid === null) {
		return <BookingLoadingState message={t("booking.loading")} />;
	}

	// Invalid token
	if (!valid) {
		return (
			<BookingInvalidState
				title={t("booking.invalidTitle")}
				message={t("booking.invalidMessage")}
			/>
		);
	}

	return (
		<div
			className={css({
				minHeight: "100vh",
				backgroundColor: "#0a0a0a",
				padding: "24px",
				display: "flex",
				justifyContent: "center",
			})}
		>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

			<div
				className={css({
					width: "100%",
					maxWidth: "600px",
					paddingTop: "40px",
				})}
			>
				<BookingHeader
					title={t("booking.title")}
					subtitle={t("booking.subtitle")}
				/>

				<BookingSlotsSection
					slots={slots}
					selectedSlot={selectedSlot}
					selectedSlotBusyIntervals={selectedSlotBusyIntervals}
					onSelect={selectSlot}
					formatDate={formatDate}
					t={t}
				/>

				{selectedSlot && (
					<BookingFormSection
						email={email}
						handleSubmit={handleSubmit}
						loading={loading}
						meetingPlace={meetingPlace}
						name={name}
						note={note}
						selectedEndAt={selectedEndAt}
						selectedStartAt={selectedStartAt}
						setEmail={setEmail}
						setMeetingPlace={setMeetingPlace}
						setName={setName}
						setNote={setNote}
						setSelectedEndAt={setSelectedEndAt}
						setSelectedStartAt={setSelectedStartAt}
						t={t}
					/>
				)}
			</div>
		</div>
	);
}
