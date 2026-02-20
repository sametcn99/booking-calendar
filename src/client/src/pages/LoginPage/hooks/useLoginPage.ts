import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api";
import { useAuth } from "../../../context/AuthContext";

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

export function useLoginPage(t: (key: string) => string) {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const result = await api.login(username, password);
			localStorage.setItem(
				"must_change_password",
				String(result.data.must_change_password),
			);
			login(result.data.token);
			navigate("/admin");
		} catch (err: unknown) {
			setError(getErrorMessage(err, t("login.error")));
		} finally {
			setLoading(false);
		}
	};

	return {
		error,
		handleSubmit,
		loading,
		password,
		setPassword,
		setUsername,
		username,
	};
}
