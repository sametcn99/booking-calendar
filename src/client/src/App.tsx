import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import { useAuth } from "./context/AuthContext";
import AppointmentsPage from "./pages/AppointmentsPage";
import BookingPage from "./pages/BookingPage";
import DashboardPage from "./pages/DashboardPage";
import LinksPage from "./pages/LinksPage";
import LoginPage from "./pages/LoginPage";
import PlannerPage from "./pages/PlannerPage";
import PublicCalendarPage from "./pages/PublicCalendarPage";
import SettingsPage from "./pages/SettingsPage";
import SlotsPage from "./pages/SlotsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } = useAuth();
	if (!isAuthenticated) return <Navigate to="/login" replace />;
	return <>{children}</>;
}

export default function App() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/book/:token" element={<BookingPage />} />
			<Route path="/calendar" element={<PublicCalendarPage />} />
			<Route
				path="/admin"
				element={
					<ProtectedRoute>
						<AdminLayout />
					</ProtectedRoute>
				}
			>
				<Route index element={<DashboardPage />} />
				<Route path="slots" element={<SlotsPage />} />
				<Route path="appointments" element={<AppointmentsPage />} />
				<Route path="links" element={<LinksPage />} />
				<Route path="planner" element={<PlannerPage />} />
				<Route path="settings" element={<SettingsPage />} />
			</Route>
			<Route path="*" element={<Navigate to="/admin" replace />} />
		</Routes>
	);
}
