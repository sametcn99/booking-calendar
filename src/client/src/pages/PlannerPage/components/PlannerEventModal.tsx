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
import { Textarea } from "baseui/textarea";
import type { PlannerFormState } from "../hooks/usePlannerPage";

interface Props {
	isOpen: boolean;
	isEdit: boolean;
	form: PlannerFormState;
	loading: boolean;
	onClose: () => void;
	onSave: () => void;
	updateForm: (field: keyof PlannerFormState, value: string) => void;
	t: (key: string) => string;
}

export default function PlannerEventModal({
	isOpen,
	isEdit,
	form,
	loading,
	onClose,
	onSave,
	updateForm,
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
			<ModalHeader>
				{isEdit ? t("planner.editTitle") : t("planner.createTitle")}
			</ModalHeader>
			<ModalBody>
				<FormControl label={t("planner.eventTitle")}>
					<Input
						value={form.title}
						placeholder={t("planner.eventTitle")}
						onChange={(e) => updateForm("title", e.currentTarget.value)}
					/>
				</FormControl>
				<FormControl label={t("planner.description")}>
					<Textarea
						value={form.description}
						placeholder={t("planner.description")}
						onChange={(e) => updateForm("description", e.currentTarget.value)}
					/>
				</FormControl>
				<FormControl label={t("planner.startTime")}>
					<Input
						type="datetime-local"
						value={form.startAt}
						onChange={(e) => updateForm("startAt", e.currentTarget.value)}
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
				<FormControl label={t("planner.endTime")}>
					<Input
						type="datetime-local"
						value={form.endAt}
						onChange={(e) => updateForm("endAt", e.currentTarget.value)}
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
				<FormControl label={t("planner.color")}>
					<Input
						type="color"
						value={form.color}
						onChange={(e) => updateForm("color", e.currentTarget.value)}
						overrides={{
							Root: {
								style: {
									borderColor: "var(--color-accent-300)",
									borderWidth: "1px",
									backgroundColor: "var(--color-bg-tertiary)",
									width: "80px",
								},
							},
							Input: {
								style: {
									cursor: "pointer",
									padding: "2px",
								},
							},
						}}
					/>
				</FormControl>
			</ModalBody>
			<ModalFooter>
				<ModalButton kind={KIND.tertiary} onClick={onClose}>
					{t("planner.cancel")}
				</ModalButton>
				<ModalButton onClick={onSave} isLoading={loading}>
					{isEdit ? t("planner.save") : t("planner.create")}
				</ModalButton>
			</ModalFooter>
		</Modal>
	);
}
