import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "baseui/modal";

interface Props {
	isOpen: boolean;
	title: string;
	message: string;
	confirmLabel: string;
	cancelLabel: string;
	onConfirm: () => Promise<void> | void;
	onClose: () => void;
	isLoading?: boolean;
}

export default function ConfirmationDialog({
	isOpen,
	title,
	message,
	confirmLabel,
	cancelLabel,
	onConfirm,
	onClose,
	isLoading = false,
}: Props) {
	const [css] = useStyletron();

	return (
		<Modal onClose={onClose} isOpen={isOpen} closeable={!isLoading}>
			<ModalHeader>{title}</ModalHeader>
			<ModalBody>
				<p
					className={css({
						margin: 0,
						color: "var(--color-text-secondary)",
						fontSize: "14px",
						lineHeight: 1.5,
					})}
				>
					{message}
				</p>
			</ModalBody>
			<ModalFooter>
				<Button
					kind={KIND.tertiary}
					size={SIZE.compact}
					onClick={onClose}
					disabled={isLoading}
				>
					{cancelLabel}
				</Button>
				<Button
					kind={KIND.secondary}
					size={SIZE.compact}
					onClick={onConfirm}
					isLoading={isLoading}
				>
					{confirmLabel}
				</Button>
			</ModalFooter>
		</Modal>
	);
}
