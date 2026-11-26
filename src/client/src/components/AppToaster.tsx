import { PLACEMENT, ToasterContainer } from "baseui/toast";

const TOAST_AUTO_HIDE_DURATION = 5000;

export default function AppToaster({
	topOnMobile = false,
}: {
	topOnMobile?: boolean;
}) {
	return (
		<ToasterContainer
			placement={PLACEMENT.bottomRight}
			autoHideDuration={TOAST_AUTO_HIDE_DURATION}
			overrides={
				topOnMobile
					? {
							Root: {
								style: {
									zIndex: 2300,
									"@media (max-width: 600px)": {
										top: "0",
										bottom: "auto",
										flexDirection: "column",
										justifyContent: "flex-start",
									},
								},
							},
						}
					: undefined
			}
		/>
	);
}
