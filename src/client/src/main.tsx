import { registerSW } from "virtual:pwa-register";
import { BaseProvider } from "baseui";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { I18nProvider } from "./context/I18nContext";
import { theme } from "./theme";
import "./index.css";

const engine = new Styletron();
const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}

if ("serviceWorker" in navigator) {
	registerSW({ immediate: true });
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<StyletronProvider value={engine}>
			<BaseProvider theme={theme}>
				<BrowserRouter>
					<I18nProvider>
						<AuthProvider>
							<App />
						</AuthProvider>
					</I18nProvider>
				</BrowserRouter>
			</BaseProvider>
		</StyletronProvider>
	</React.StrictMode>,
);
