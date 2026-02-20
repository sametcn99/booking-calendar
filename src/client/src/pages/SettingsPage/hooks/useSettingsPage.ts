import { toaster } from "baseui/toast";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../api";

interface Params {
	t: (key: string) => string;
	setLanguage: (lang: "en" | "tr") => Promise<void>;
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

export function useSettingsPage({ setLanguage, t }: Params) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [changingPassword, setChangingPassword] = useState(false);
	const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
	const [mustChangePassword, setMustChangePassword] = useState(false);
	const [savingLanguage, setSavingLanguage] = useState(false);
	const [adminEmail, setAdminEmail] = useState("");
	const [savingAdminEmail, setSavingAdminEmail] = useState(false);
	const [calendarSharingEnabled, setCalendarSharingEnabled] = useState(false);
	const [savingCalendarSharing, setSavingCalendarSharing] = useState(false);

	useEffect(() => {
		setMustChangePassword(
			localStorage.getItem("must_change_password") === "true",
		);
	}, []);

	useEffect(() => {
		if (mustChangePassword) setIsPasswordSectionOpen(true);
	}, [mustChangePassword]);

	useEffect(() => {
		api
			.getAdminEmail()
			.then((email) => setAdminEmail(email))
			.catch(() => {});
	}, []);

	useEffect(() => {
		api
			.getCalendarSharing()
			.then((enabled) => setCalendarSharingEnabled(enabled))
			.catch(() => {});
	}, []);

	const handleChangePassword = useCallback(
		async (event: React.FormEvent) => {
			event.preventDefault();

			if (newPassword !== confirmPassword) {
				toaster.negative(t("settings.passwordMismatch"), {});
				return;
			}

			setChangingPassword(true);
			try {
				await api.changePassword(currentPassword, newPassword);
				toaster.positive(t("settings.passwordChanged"), {});
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
				setMustChangePassword(false);
				localStorage.setItem("must_change_password", "false");
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setChangingPassword(false);
			}
		},
		[confirmPassword, currentPassword, newPassword, t],
	);

	const handleLanguageChange = useCallback(
		async (lang: "en" | "tr") => {
			setSavingLanguage(true);
			try {
				await setLanguage(lang);
				toaster.positive(t("settings.languageSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingLanguage(false);
			}
		},
		[setLanguage, t],
	);

	const handleSaveAdminEmail = useCallback(
		async (event: React.FormEvent) => {
			event.preventDefault();
			setSavingAdminEmail(true);
			try {
				const response = await api.setAdminEmail(adminEmail);
				setAdminEmail(response.data.email);
				toaster.positive(t("settings.adminEmailSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingAdminEmail(false);
			}
		},
		[adminEmail, t],
	);

	const handleToggleCalendarSharing = useCallback(
		async (enabled: boolean) => {
			setSavingCalendarSharing(true);
			try {
				await api.setCalendarSharing(enabled);
				setCalendarSharingEnabled(enabled);
				toaster.positive(t("settings.calendarSharingSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingCalendarSharing(false);
			}
		},
		[t],
	);

	return {
		adminEmail,
		calendarSharingEnabled,
		changingPassword,
		confirmPassword,
		currentPassword,
		handleChangePassword,
		handleLanguageChange,
		handleSaveAdminEmail,
		handleToggleCalendarSharing,
		isPasswordSectionOpen,
		mustChangePassword,
		newPassword,
		savingAdminEmail,
		savingCalendarSharing,
		savingLanguage,
		setAdminEmail,
		setConfirmPassword,
		setCurrentPassword,
		setIsPasswordSectionOpen,
		setNewPassword,
	};
}
