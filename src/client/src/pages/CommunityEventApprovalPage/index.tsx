import { useStyletron } from "baseui";
import { Button, SIZE } from "baseui/button";
import { Input } from "baseui/input";
import { useI18n } from "../../context/I18nContext";
import ApprovalProgressBar from "./components/ApprovalProgressBar";
import ApprovalStateNotice from "./components/ApprovalStateNotice";
import CommunityEventInfoCard from "./components/CommunityEventInfoCard";
import ShareLinkCard from "./components/ShareLinkCard";
import { useCommunityEventApprovalPage } from "./hooks/useCommunityEventApprovalPage";

export default function CommunityEventApprovalPage() {
	const [css] = useStyletron();
	const { t } = useI18n();
	const {
		alreadyApprovedLocal,
		approved,
		approverName,
		approving,
		error,
		event,
		handleApprove,
		handleCopyLink,
		progress,
		setApproverName,
		shareLink,
	} = useCommunityEventApprovalPage(t);

	if (error) {
		return (
			<div
				className={css({
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					backgroundColor: "var(--color-bg-primary)",
					color: "var(--color-text-muted)",
					fontSize: "18px",
				})}
			>
				{error}
			</div>
		);
	}

	if (!event) {
		return (
			<div
				className={css({
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					backgroundColor: "var(--color-bg-primary)",
					color: "var(--color-text-muted)",
					fontSize: "18px",
				})}
			>
				Loading...
			</div>
		);
	}

	return (
		<div
			className={css({
				minHeight: "100vh",
				backgroundColor: "var(--color-bg-primary)",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				padding: "24px",
			})}
		>
			<div
				className={css({
					backgroundColor: "var(--color-bg-secondary)",
					borderRadius: "16px",
					padding: "32px",
					border: "1px solid var(--color-bg-quaternary)",
					maxWidth: "480px",
					width: "100%",
				})}
			>
				<h1
					className={css({
						fontSize: "24px",
						fontWeight: 700,
						color: "var(--color-text-primary)",
						marginBottom: "24px",
						textAlign: "center",
					})}
				>
					{t("communityEvents.approveTitle")}
				</h1>

				<CommunityEventInfoCard event={event} t={t} />

				<ApprovalProgressBar
					current={event.current_approvals}
					progress={progress}
					required={event.required_approvals}
					status={event.status}
					t={t}
				/>

				<div className={css({ marginBottom: "16px" })}>
					<div
						className={css({
							fontSize: "13px",
							color: "var(--color-text-secondary)",
							marginBottom: "6px",
						})}
					>
						{t("communityEvents.approverFullName")}
					</div>
					<Input
						value={approverName}
						onChange={(e) => setApproverName(e.currentTarget.value)}
						placeholder={t("communityEvents.approverFullNamePlaceholder")}
						type="text"
						size={SIZE.compact}
					/>
				</div>

				<ShareLinkCard onCopy={handleCopyLink} shareLink={shareLink} t={t} />

				{approved && (
					<ApprovalStateNotice
						type="success"
						message={t("communityEvents.approved")}
					/>
				)}

				{event.status === "pending" && !approved && !alreadyApprovedLocal && (
					<Button
						size={SIZE.large}
						onClick={handleApprove}
						isLoading={approving}
						overrides={{
							BaseButton: {
								style: { width: "100%" },
							},
						}}
					>
						{t("communityEvents.approveBtn")}
					</Button>
				)}

				{event.status === "pending" && alreadyApprovedLocal && !approved && (
					<ApprovalStateNotice
						type="warning"
						message={t("communityEvents.alreadyApprovedLocal")}
					/>
				)}
			</div>
		</div>
	);
}
