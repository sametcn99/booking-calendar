import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	mustChangePassword: boolean;
	login: (mustChangePassword: boolean) => void;
	logout: () => Promise<void>;
	markPasswordChanged: () => void;
}

const AuthContext = createContext<AuthContextType>({
	isAuthenticated: false,
	isLoading: true,
	mustChangePassword: false,
	login: () => {
		return;
	},
	logout: async () => {
		return;
	},
	markPasswordChanged: () => {
		return;
	},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [mustChangePassword, setMustChangePassword] = useState(false);

	useEffect(() => {
		let isMounted = true;

		api
			.getAuthSession()
			.then((result) => {
				if (!isMounted) return;
				setIsAuthenticated(result.data.authenticated);
				setMustChangePassword(result.data.must_change_password);
			})
			.catch(() => {
				if (!isMounted) return;
				setIsAuthenticated(false);
				setMustChangePassword(false);
			})
			.finally(() => {
				if (!isMounted) return;
				setIsLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, []);

	const login = (mustChange: boolean) => {
		setIsAuthenticated(true);
		setMustChangePassword(mustChange);
	};

	const logout = async () => {
		try {
			await api.logout();
		} finally {
			setIsAuthenticated(false);
			setMustChangePassword(false);
		}
	};

	const markPasswordChanged = () => {
		setMustChangePassword(false);
	};

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				isLoading,
				mustChangePassword,
				login,
				logout,
				markPasswordChanged,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
