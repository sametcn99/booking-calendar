import { useStyletron } from "baseui";
import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useI18n } from "../../context/I18nContext";
import DashboardCalendar from "./components/DashboardCalendar";
import DashboardHeader from "./components/DashboardHeader";
import StatsCards from "./components/StatsCards";
import { useDashboardPage } from "./hooks/useDashboardPage";

export default function DashboardPage() {
	const [_css] = useStyletron();
	const { t } = useI18n();
	const { cards, slots, appointments, plannerEvents } = useDashboardPage({ t });

	return (
		<div>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

			<DashboardHeader
				title={t("dashboard.title")}
				description={t("dashboard.description")}
			/>

			<StatsCards cards={cards} />

			<DashboardCalendar
				slots={slots}
				appointments={appointments}
				plannerEvents={plannerEvents}
			/>
		</div>
	);
}
