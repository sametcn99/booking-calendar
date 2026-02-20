import { KIND } from "baseui/button";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";
import {
	Modal,
	ModalBody,
	ModalButton,
	ModalFooter,
	ModalHeader,
} from "baseui/modal";

interface Props {
	endAt: string;
	isOpen: boolean;
	loading: boolean;
	onClose: () => void;
	onCreate: () => void;
	setSlotName: (value: string) => void;
	setEndAt: (value: string) => void;
	setStartAt: (value: string) => void;
	slotName: string;
	startAt: string;
	t: (key: string) => string;
}

export default function CreateSlotModal({
	endAt,
	isOpen,
	loading,
	onClose,
	onCreate,
	setSlotName,
	setEndAt,
	setStartAt,
	slotName,
	startAt,
	t,
}: Props) {
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
			<ModalHeader>{t("slots.createTitle")}</ModalHeader>
			<ModalBody>
				<FormControl label={t("slots.name")}>
					<Input
						value={slotName}
						placeholder={t("slots.namePlaceholder")}
						onChange={(e) => setSlotName(e.currentTarget.value)}
					/>
				</FormControl>
				<FormControl label={t("slots.startTime")}>
					<Input
						type="datetime-local"
						value={startAt}
						onChange={(e) => setStartAt(e.currentTarget.value)}
						overrides={{
							Root: {
								style: {
									borderColor: "var(--color-accent-300)",
									borderWidth: "1px",
									backgroundColor: "var(--color-bg-tertiary)",
								},
							},
						}}
					/>
				</FormControl>
				<FormControl label={t("slots.endTime")}>
					<Input
						type="datetime-local"
						value={endAt}
						onChange={(e) => setEndAt(e.currentTarget.value)}
						overrides={{
							Root: {
								style: {
									borderColor: "var(--color-accent-300)",
									borderWidth: "1px",
									backgroundColor: "var(--color-bg-tertiary)",
								},
							},
						}}
					/>
				</FormControl>
			</ModalBody>
			<ModalFooter>
				<div
					style={{
						display: "flex",
						gap: "10px",
						justifyContent: "flex-end",
						width: "100%",
					}}
				>
					<ModalButton kind={KIND.tertiary} onClick={onClose}>
						{t("slots.cancel")}
					</ModalButton>
					<ModalButton onClick={onCreate} isLoading={loading}>
						{t("slots.create")}
					</ModalButton>
				</div>
			</ModalFooter>
		</Modal>
	);
}
