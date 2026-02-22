import { Input, type InputProps } from "baseui/input";
import type React from "react";

interface IntegerInputProps extends InputProps {
	onNumberChange?: (value: string) => void;
	allowNegative?: boolean;
}

export default function IntegerInput({
	onNumberChange,
	allowNegative = false,
	onChange,
	onKeyDown,
	...props
}: IntegerInputProps) {
	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const forbiddenKeys = ["e", "E", ".", ","];
		if (!allowNegative) {
			forbiddenKeys.push("-", "+");
		}

		if (forbiddenKeys.includes(e.key)) {
			e.preventDefault();
		}

		if (onKeyDown) {
			onKeyDown(e);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const val = e.currentTarget.value;
		const sanitized = allowNegative
			? val.replace(/[^\d-]/g, "")
			: val.replace(/\D/g, "");

		if (onNumberChange) {
			onNumberChange(sanitized);
		}

		if (onChange) {
			onChange(e);
		}
	};

	return (
		<Input
			{...props}
			type="number"
			onKeyDown={handleKeyDown}
			onChange={handleChange}
		/>
	);
}
