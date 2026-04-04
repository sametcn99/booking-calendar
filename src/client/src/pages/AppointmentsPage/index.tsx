import { useStyletron } from "baseui";
import ListFiltersBar from "../../components/ListFilters/ListFiltersBar";
import ListFiltersFeedback from "../../components/ListFilters/ListFiltersFeedback";
import PageLoadingSpinner from "../../components/PageLoadingSpinner";
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
	const [css] = useStyletron();
	const { t, locale } = useI18n();
	const {
		initialLoading,
		filteredAppointments,
		handleCancel,
		handleDelete,
		handleApprove,
		handleReject,
		handleRepairCalDAV,
		repairingSlugId,
		repairingAction,
		setStatusFilter,
		statusFilter,
		search,
		setSearch,
		sort,
		setSort,
		from,
		setFrom,
		to,
		setTo,
		clearFilters,
		isActive,
		totalCount,
		pendingCount,
	} = useAppointmentsPage(t);

	const formatDate = (d: string) =>
		new Date(d).toLocaleString(locale, {
			dateStyle: "medium",
			timeStyle: "short",
		});

	return (
		<div>
			<AppointmentsHeader
				title={t("appointments.title")}
				description={t("appointments.description")}
			/>

			{initialLoading ? (
				<PageLoadingSpinner label={t("common.loading")} />
			) : (
				<>
					<div
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "16px",
							marginBottom: "24px",
						})}
					>
						<AppointmentsFilterSection
							statusFilter={statusFilter}
							onChange={setStatusFilter}
							pendingCount={pendingCount}
							t={t}
						/>

						<ListFiltersBar
							search={search}
							onSearchChange={setSearch}
							sort={sort}
							onSortChange={setSort}
							from={from}
							onFromChange={setFrom}
							to={to}
							onToChange={setTo}
							onClear={clearFilters}
							isActive={isActive}
							t={t}
						/>
					</div>

					<ListFiltersFeedback
						count={filteredAppointments.length}
						totalCount={totalCount}
						isActive={isActive}
						search={search}
						from={from}
						to={to}
						t={t}
					/>

					{filteredAppointments.length === 0 && isActive ? (
						<div
							className={css({
								textAlign: "center",
								padding: "48px",
								fontSize: "14px",
								color: "var(--color-text-tertiary)",
								backgroundColor: "var(--color-bg-secondary)",
								borderRadius: "12px",
								border: "1px dashed var(--color-border-primary)",
							})}
						>
							{t("appointments.empty")}
						</div>
					) : (
						<AppointmentsListSection
							appointments={filteredAppointments}
							formatDate={formatDate}
							onCancel={handleCancel}
							onDelete={handleDelete}
							onApprove={handleApprove}
							onReject={handleReject}
							onRepairCalDAV={handleRepairCalDAV}
							repairingSlugId={repairingSlugId}
							repairingAction={repairingAction}
							isPastAppointment={isPastAppointment}
							canDeleteAppointment={canDeleteAppointment}
							t={t}
						/>
					)}
				</>
			)}
		</div>
	);
}
