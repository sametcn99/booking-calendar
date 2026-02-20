import { useStyletron } from "baseui";
import { KIND, SIZE } from "baseui/button";
import { Input } from "baseui/input";
import {
	Modal,
	ModalBody,
	ModalButton,
	ModalFooter,
	ModalHeader,
} from "baseui/modal";
import { Textarea } from "baseui/textarea";

interface Props {
	color: string;
	creating: boolean;
	description: string;
	endAt: string;
	isOpen: boolean;
	onClose: () => void;
	onCreate: () => void;
	requiredApprovals: number;
	setColor: (value: string) => void;
	setDescription: (value: string) => void;
	setEndAt: (value: string) => void;
	setRequiredApprovals: (value: number) => void;
	setStartAt: (value: string) => void;
	setTitle: (value: string) => void;
	startAt: string;
	t: (key: string) => string;
	title: string;
}

export default function CommunityEventCreateModal({
	color,
	creating,
	description,
	endAt,
	isOpen,
	onClose,
	onCreate,
	requiredApprovals,
	setColor,
	setDescription,
	setEndAt,
	setRequiredApprovals,
	setStartAt,
	setTitle,
	startAt,
	t,
	title,
}: Props) {
	const [css] = useStyletron();

	return (
		<Modal
			onClose={onClose}
			isOpen={isOpen}
			overrides={{
				Dialog: {
					style: {
						backgroundColor: "var(--color-bg-secondary)",
						borderRadius: "12px",
					},
				},
			}}
		>
			<ModalHeader>{t("communityEvents.create")}</ModalHeader>
			<ModalBody>
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "10px",
					})}
				>
					<div>
						<div
							className={css({
								fontSize: "12px",
								color: "var(--color-text-secondary)",
								marginBottom: "4px",
							})}
						>
							{t("communityEvents.eventTitle")}
						</div>
						<Input
							value={title}
							onChange={(e) => setTitle(e.currentTarget.value)}
							placeholder={t("communityEvents.eventTitlePlaceholder")}
							size={SIZE.compact}
						/>
					</div>

					<div>
						<div
							className={css({
								fontSize: "12px",
								color: "var(--color-text-secondary)",
								marginBottom: "4px",
							})}
						>
							{t("communityEvents.description")}
						</div>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.currentTarget.value)}
							placeholder={t("communityEvents.descriptionPlaceholder")}
							size={SIZE.compact}
						/>
					</div>

					<div
						className={css({
							display: "flex",
							gap: "10px",
							flexWrap: "wrap",
						})}
					>
						<div className={css({ flex: 1, minWidth: "140px" })}>
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-secondary)",
									marginBottom: "4px",
								})}
							>
								{t("communityEvents.startTime")}
							</div>
							<Input
								value={startAt}
								onChange={(e) => setStartAt(e.currentTarget.value)}
								type="datetime-local"
								size={SIZE.compact}
							/>
						</div>
						<div className={css({ flex: 1, minWidth: "140px" })}>
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-secondary)",
									marginBottom: "4px",
								})}
							>
								{t("communityEvents.endTime")}
							</div>
							<Input
								value={endAt}
								onChange={(e) => setEndAt(e.currentTarget.value)}
								type="datetime-local"
								size={SIZE.compact}
							/>
						</div>
					</div>

					<div
						className={css({
							display: "flex",
							gap: "10px",
							flexWrap: "wrap",
						})}
					>
						<div className={css({ flex: 1, minWidth: "100px" })}>
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-secondary)",
									marginBottom: "4px",
								})}
							>
								{t("communityEvents.color")}
							</div>
							<input
								type="color"
								aria-label={t("communityEvents.color")}
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className={css({
									width: "100%",
									height: "32px",
									border: "none",
									borderRadius: "6px",
									cursor: "pointer",
									backgroundColor: "transparent",
								})}
							/>
						</div>
						<div className={css({ flex: 1, minWidth: "100px" })}>
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-secondary)",
									marginBottom: "4px",
								})}
							>
								{t("communityEvents.requiredApprovals")}
							</div>
							<Input
								value={String(requiredApprovals)}
								onChange={(e) =>
									setRequiredApprovals(Number(e.currentTarget.value) || 1)
								}
								type="number"
								min={1}
								size={SIZE.compact}
							/>
						</div>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalButton kind={KIND.tertiary} onClick={onClose}>
					{t("communityEvents.cancel")}
				</ModalButton>
				<ModalButton onClick={onCreate} isLoading={creating}>
					{t("communityEvents.createBtn")}
				</ModalButton>
			</ModalFooter>
		</Modal>
	);
}
