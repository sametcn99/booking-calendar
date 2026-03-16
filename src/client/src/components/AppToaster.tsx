import { PLACEMENT, ToasterContainer } from "baseui/toast";

const TOAST_AUTO_HIDE_DURATION = 5000;

export default function AppToaster() {
	return (
		<ToasterContainer
			placement={PLACEMENT.bottomRight}
			autoHideDuration={TOAST_AUTO_HIDE_DURATION}
		/>
	);
}
