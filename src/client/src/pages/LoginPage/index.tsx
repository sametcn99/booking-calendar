import { Button } from "baseui/button";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";
import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useI18n } from "../../context/I18nContext";
import ErrorBanner from "./components/ErrorBanner";
import LoginFormCard from "./components/LoginFormCard";
import LoginHeader from "./components/LoginHeader";
import LoginPageLayout from "./components/LoginPageLayout";
import { useLoginPage } from "./hooks/useLoginPage";

export default function LoginPage() {
	const { t } = useI18n();
	const {
		error,
		handleSubmit,
		loading,
		password,
		setPassword,
		setUsername,
		username,
	} = useLoginPage(t);

	return (
		<LoginPageLayout>
			<ToasterContainer placement={PLACEMENT.bottomRight} />
			<LoginFormCard onSubmit={handleSubmit}>
				<LoginHeader title={t("login.title")} />

				<ErrorBanner message={error} />

				<FormControl label={t("login.username")}>
					<Input
						value={username}
						onChange={(e) => setUsername(e.currentTarget.value)}
						placeholder={t("login.usernamePlaceholder")}
						autoComplete="username"
					/>
				</FormControl>

				<FormControl label={t("login.password")}>
					<Input
						value={password}
						onChange={(e) => setPassword(e.currentTarget.value)}
						type="password"
						placeholder={t("login.passwordPlaceholder")}
						autoComplete="current-password"
					/>
				</FormControl>

				<Button
					type="submit"
					isLoading={loading}
					overrides={{
						BaseButton: {
							style: { width: "100%", marginTop: "16px" },
						},
					}}
				>
					{t("login.submit")}
				</Button>
			</LoginFormCard>
		</LoginPageLayout>
	);
}
