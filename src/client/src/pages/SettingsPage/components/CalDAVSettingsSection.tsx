import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Checkbox, STYLE_TYPE } from "baseui/checkbox";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";
import { Select } from "baseui/select";
import type {
	ApiCalDAVCalendar,
	ApiCalDAVQueueSnapshot,
	ApiCalDAVRepairAction,
	ApiCalDAVSettings,
} from "../../../api";

interface Props {
	enabled: boolean;
	baseUrl: string;
	username: string;
	password: string;
	hasPassword: boolean;
	writableCalendarUrl: string;
	calendars: ApiCalDAVCalendar[];
	lastSyncAt: string | null;
	lastSyncStatus: ApiCalDAVSettings["last_sync_status"];
	lastSyncError: string | null;
	health: ApiCalDAVSettings["health"];
	queue: ApiCalDAVQueueSnapshot;
	saving: boolean;
	testing: boolean;
	syncing: boolean;
	repairingSlugId: string | null;
	repairingAction: ApiCalDAVRepairAction | null;
	onEnabledChange: (value: boolean) => void;
	onBaseUrlChange: (value: string) => void;
	onUsernameChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onWritableCalendarUrlChange: (value: string) => void;
	onSubmit: (event: React.FormEvent) => void;
	onTest: () => void;
	onRetrySync: () => void;
	onRepairQueueItem: (slugId: string, action: ApiCalDAVRepairAction) => void;
	t: (key: string) => string;
	surface?: "card" | "list";
}

export default function CalDAVSettingsSection({
	enabled,
	baseUrl,
	username,
	password,
	hasPassword,
	writableCalendarUrl,
	calendars,
	lastSyncAt,
	lastSyncStatus,
	lastSyncError,
	health,
	queue,
	saving,
	testing,
	syncing,
	repairingSlugId,
	repairingAction,
	onEnabledChange,
	onBaseUrlChange,
	onUsernameChange,
	onPasswordChange,
	onWritableCalendarUrlChange,
	onSubmit,
	onTest,
	onRetrySync,
	onRepairQueueItem,
	t,
	surface = "card",
}: Props) {
	const [css] = useStyletron();
	const isList = surface === "list";
	const backgroundSyncMinutes = Math.max(
		1,
		Math.round(health.background_sync_interval_ms / 60000),
	);
	const calendarOptions = calendars.map((calendar) => ({
		id: calendar.url,
		label: calendar.display_name,
	}));
	const queueItems = queue.items.slice(0, 8);

	return (
		<div
			className={css({
				backgroundColor: "var(--color-bg-secondary)",
				borderRadius: isList ? "10px" : "12px",
				padding: isList ? "18px" : "24px",
				border: "1px solid var(--color-bg-quaternary)",
			})}
		>
			<h2
				className={css({
					fontSize: "18px",
					fontWeight: 700,
					color: "var(--color-text-primary)",
					marginBottom: "12px",
				})}
			>
				{t("settings.caldav")}
			</h2>
			<div
				className={css({
					fontSize: "13px",
					color: "var(--color-text-secondary)",
					marginBottom: "14px",
				})}
			>
				{t("settings.caldavDescription")}
			</div>

			<form onSubmit={onSubmit}>
				<div
					className={css({
						display: "grid",
						gap: "16px",
					})}
				>
					<Checkbox
						checked={enabled}
						onChange={(event) => onEnabledChange(event.currentTarget.checked)}
						checkmarkType={STYLE_TYPE.toggle_round}
						disabled={saving}
					>
						{enabled
							? t("settings.caldavEnabled")
							: t("settings.caldavDisabled")}
					</Checkbox>

					<FormControl label={t("settings.caldavBaseUrl")}>
						<Input
							type="url"
							value={baseUrl}
							onChange={(event) => onBaseUrlChange(event.currentTarget.value)}
							placeholder={t("settings.caldavBaseUrlPlaceholder")}
							autoComplete="url"
						/>
					</FormControl>

					<div
						className={css({
							display: "grid",
							gap: "12px",
							gridTemplateColumns: "1fr",
							"@media screen and (min-width: 760px)": {
								gridTemplateColumns: "1fr 1fr",
							},
						})}
					>
						<FormControl label={t("settings.caldavUsername")}>
							<Input
								value={username}
								onChange={(event) =>
									onUsernameChange(event.currentTarget.value)
								}
								autoComplete="username"
							/>
						</FormControl>

						<FormControl
							label={t("settings.caldavPassword")}
							caption={
								hasPassword
									? t("settings.caldavPasswordStoredHint")
									: t("settings.caldavPasswordHint")
							}
						>
							<Input
								type="password"
								value={password}
								onChange={(event) =>
									onPasswordChange(event.currentTarget.value)
								}
								placeholder={
									hasPassword
										? t("settings.caldavPasswordPlaceholderStored")
										: t("settings.caldavPasswordPlaceholder")
								}
								autoComplete="new-password"
							/>
						</FormControl>
					</div>

					<FormControl
						label={t("settings.caldavWritableCalendar")}
						caption={t("settings.caldavWritableCalendarDescription")}
					>
						<Select
							options={calendarOptions}
							value={
								writableCalendarUrl
									? calendarOptions.filter(
											(option) => option.id === writableCalendarUrl,
										)
									: []
							}
							onChange={(params) => {
								const selected = params.value[0]?.id;
								onWritableCalendarUrlChange(
									typeof selected === "string" ? selected : "",
								);
							}}
							placeholder={t("settings.caldavWritableCalendarPlaceholder")}
							clearable
							disabled={saving || testing || calendarOptions.length === 0}
						/>
					</FormControl>

					<div
						className={css({
							padding: "14px",
							borderRadius: "10px",
							border:
								health.failed_appointments_count > 0 ||
								lastSyncStatus === "error"
									? "1px solid var(--color-error-border, var(--color-error-text))"
									: "1px solid var(--color-bg-quaternary)",
							backgroundColor:
								health.failed_appointments_count > 0 ||
								lastSyncStatus === "error"
									? "var(--color-error-bg)"
									: "var(--color-bg-tertiary)",
							display: "grid",
							gap: "6px",
							fontSize: "12px",
						})}
					>
						<div
							className={css({
								fontSize: "13px",
								fontWeight: 700,
								color: "var(--color-text-primary)",
							})}
						>
							{t("settings.caldavHealthTitle")}
						</div>
						<div>
							{t("settings.caldavLastSyncStatus")}{" "}
							{t(`settings.caldavStatus.${lastSyncStatus}`)}
						</div>
						<div>
							{t("settings.caldavFailedAppointments")}{" "}
							{health.failed_appointments_count}
						</div>
						<div>
							{t("settings.caldavRetryableAppointments")}{" "}
							{health.retryable_appointments_count}
						</div>
						<div>
							{t("settings.caldavQueueTotal")} {queue.summary.total}
						</div>
						<div>
							{t("settings.caldavConflictCount")}{" "}
							{health.error_breakdown.conflict}
						</div>
						<div>
							{t("settings.caldavUnsyncedApproved")}{" "}
							{health.unsynced_approved_count}
						</div>
						<div>
							{t("settings.caldavBackgroundSync")}{" "}
							{health.background_sync_enabled
								? t("settings.caldavBackgroundSyncEnabled")
								: t("settings.caldavBackgroundSyncDisabled")}
						</div>
						{health.background_sync_enabled ? (
							<div>
								{t("settings.caldavBackgroundSyncInterval")}{" "}
								{backgroundSyncMinutes}
							</div>
						) : null}
						{health.last_background_sync_at ? (
							<div>
								{t("settings.caldavLastBackgroundSync")}{" "}
								{new Date(health.last_background_sync_at).toLocaleString()}
							</div>
						) : null}
						{health.next_background_sync_at ? (
							<div>
								{t("settings.caldavNextBackgroundSync")}{" "}
								{new Date(health.next_background_sync_at).toLocaleString()}
							</div>
						) : null}
						{lastSyncAt ? (
							<div>
								{t("settings.caldavLastSyncAt")}{" "}
								{new Date(lastSyncAt).toLocaleString()}
							</div>
						) : null}
						{lastSyncError ? <div>{lastSyncError}</div> : null}
						{health.degraded_mode.enabled ? (
							<div>{t("settings.caldavDegradedModeEnabled")}</div>
						) : null}
					</div>

					<div
						className={css({
							display: "grid",
							gap: "10px",
							padding: "14px",
							borderRadius: "10px",
							border: "1px solid var(--color-bg-quaternary)",
							backgroundColor: "var(--color-bg-tertiary)",
						})}
					>
						<div
							className={css({
								fontSize: "13px",
								fontWeight: 700,
								color: "var(--color-text-primary)",
							})}
						>
							{t("settings.caldavQueueTitle")}
						</div>
						{queueItems.length === 0 ? (
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-secondary)",
								})}
							>
								{t("settings.caldavQueueEmpty")}
							</div>
						) : (
							queueItems.map((item) => (
								<div
									key={`${item.appointment_id}-${item.slug_id || "no-slug"}`}
									className={css({
										display: "grid",
										gap: "6px",
										padding: "12px",
										borderRadius: "8px",
										backgroundColor: item.conflict
											? "var(--color-error-bg)"
											: "var(--color-bg-secondary)",
										border: item.conflict
											? "1px solid var(--color-error-text)"
											: "1px solid var(--color-bg-quaternary)",
									})}
								>
									<div
										className={css({
											fontSize: "13px",
											fontWeight: 700,
											color: "var(--color-text-primary)",
										})}
									>
										{item.name}
									</div>
									<div
										className={css({
											fontSize: "12px",
											color: "var(--color-text-secondary)",
										})}
									>
										{t("settings.caldavQueueStatus")} {item.status}
									</div>
									{item.error_message ? (
										<div
											className={css({
												fontSize: "12px",
												color: "var(--color-text-primary)",
											})}
										>
											{item.error_message}
										</div>
									) : null}
									{item.conflict ? (
										<>
											<div
												className={css({
													fontSize: "12px",
													color: "var(--color-error-text)",
												})}
											>
												{t("settings.caldavConflictDetail")}{" "}
												{item.conflict.detail ||
													t("settings.caldavConflictDetected")}
											</div>
											<div
												className={css({
													fontSize: "12px",
													color: "var(--color-text-secondary)",
												})}
											>
												{t("settings.caldavConflictEtags")}{" "}
												{item.conflict.local_etag || "-"} /{" "}
												{item.conflict.remote_etag || "-"}
											</div>
										</>
									) : null}
									{item.slug_id ? (
										<div
											className={css({
												display: "flex",
												flexWrap: "wrap",
												gap: "8px",
											})}
										>
											{item.available_actions.map((action) => (
												<Button
													key={action}
													type="button"
													size={SIZE.compact}
													kind={KIND.secondary}
													onClick={() =>
														onRepairQueueItem(item.slug_id as string, action)
													}
													isLoading={
														repairingSlugId === item.slug_id &&
														repairingAction === action
													}
													disabled={saving || testing || syncing}
												>
													{t(`settings.caldavRepairActionLabel.${action}`)}
												</Button>
											))}
										</div>
									) : null}
								</div>
							))
						)}
					</div>

					<div
						className={css({
							display: "flex",
							flexWrap: "wrap",
							gap: "10px",
						})}
					>
						<Button type="submit" isLoading={saving} disabled={testing}>
							{t("settings.caldavSave")}
						</Button>
						<Button
							type="button"
							kind={KIND.secondary}
							onClick={onTest}
							isLoading={testing}
							disabled={saving}
						>
							{t("settings.caldavTestConnection")}
						</Button>
						<Button
							type="button"
							kind={KIND.secondary}
							onClick={onRetrySync}
							isLoading={syncing}
							disabled={
								saving || testing || health.retryable_appointments_count === 0
							}
						>
							{health.is_sync_running
								? t("settings.caldavSyncRunning")
								: t("settings.caldavRetrySync")}
						</Button>
					</div>

					{calendars.length > 0 ? (
						<div
							className={css({
								display: "grid",
								gap: "8px",
								fontSize: "12px",
								color: "var(--color-text-secondary)",
							})}
						>
							<div>
								{t("settings.caldavCalendarsLoaded")}: {calendars.length}
							</div>
							{calendars.map((calendar) => (
								<div key={calendar.url}>{calendar.display_name}</div>
							))}
						</div>
					) : null}
				</div>
			</form>
		</div>
	);
}
