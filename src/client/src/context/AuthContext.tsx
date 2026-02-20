import type React from "react";
import { createContext, useContext, useState } from "react";

interface AuthContextType {
	token: string | null;
	isAuthenticated: boolean;
	login: (token: string) => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
	token: null,
	isAuthenticated: false,
	login: () => {},
	logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [token, setToken] = useState<string | null>(() =>
		localStorage.getItem("auth_token"),
	);

	const login = (newToken: string) => {
		localStorage.setItem("auth_token", newToken);
		setToken(newToken);
	};

	const logout = () => {
		localStorage.removeItem("auth_token");
		localStorage.removeItem("must_change_password");
		setToken(null);
	};

	return (
		<AuthContext.Provider
			value={{
				token,
				isAuthenticated: !!token,
				login,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
