import { useStyletron } from "baseui";
import { SIZE as BUTTON_SIZE, Button, KIND } from "baseui/button";
import { SIZE as INPUT_SIZE, Input } from "baseui/input";
import { Select } from "baseui/select";
import { ArrowUpDown, Calendar, Search, X } from "lucide-react";
import type { SortOrder } from "../../hooks/useListFilters";

interface Props {
	search: string;
	onSearchChange: (value: string) => void;
	sort: SortOrder;
	onSortChange: (value: SortOrder) => void;
	from: string;
	onFromChange: (value: string) => void;
	to: string;
	onToChange: (value: string) => void;
	onClear: () => void;
	isActive: boolean;
	t: (key: string) => string;
	placeholder?: string;
}

export default function ListFiltersBar({
	search,
	onSearchChange,
	sort,
	onSortChange,
	from,
	onFromChange,
	to,
	onToChange,
	onClear,
	isActive,
	t,
	placeholder,
}: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				gap: "16px",
				marginBottom: "20px",
				backgroundColor: "var(--color-bg-secondary)",
				padding: "16px",
				borderRadius: "12px",
				border: "1px solid var(--color-border-primary)",
				boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
			})}
		>
			<div
				className={css({
					display: "flex",
					gap: "12px",
					flexWrap: "wrap",
					alignItems: "flex-start",
				})}
			>
				{/* Search */}
				<div className={css({ flex: "1 1 100%" })}>
					<Input
						value={search}
						onChange={(e) => onSearchChange(e.currentTarget.value)}
						placeholder={placeholder || t("common.searchPlaceholder")}
						size={INPUT_SIZE.compact}
						startEnhancer={<Search size={16} color="var(--color-accent-600)" />}
						clearable
						overrides={{
							Root: {
								style: {
									borderRadius: "8px",
									backgroundColor: "var(--color-bg-tertiary)",
									borderWidth: "1px",
									borderColor: "var(--color-border-primary)",
								},
							},
							InputContainer: {
								style: {
									backgroundColor: "transparent",
								},
							},
							StartEnhancer: {
								style: {
									backgroundColor: "transparent",
									paddingLeft: "12px",
									paddingRight: "0px",
								},
							},
						}}
					/>
				</div>

				{/* Sort */}
				<div className={css({ flex: "1 1 180px" })}>
					<Select
						options={[
							{ id: "newest", label: t("common.sortNewest") },
							{ id: "oldest", label: t("common.sortOldest") },
						]}
						value={[{ id: sort }]}
						onChange={(params) => {
							if (params.value[0]) {
								onSortChange(params.value[0].id as SortOrder);
							}
						}}
						size={INPUT_SIZE.compact}
						clearable={false}
						searchable={false}
						overrides={{
							ControlContainer: {
								style: {
									borderRadius: "8px",
									backgroundColor: "var(--color-bg-tertiary)",
									borderWidth: "1px",
									borderColor: "var(--color-border-primary)",
									paddingLeft: "8px",
								},
							},
							ValueContainer: {
								style: {
									paddingLeft: "4px",
								},
							},
							Placeholder: {
								style: {
									paddingLeft: "4px",
								},
							},
						}}
						getOptionLabel={({ option }) => (
							<div
								style={{ display: "flex", alignItems: "center", gap: "8px" }}
							>
								<ArrowUpDown size={14} color="var(--color-accent-600)" />
								<span>{option.label}</span>
							</div>
						)}
						getValueLabel={({ option }) => (
							<div
								style={{ display: "flex", alignItems: "center", gap: "8px" }}
							>
								<ArrowUpDown size={14} color="var(--color-accent-600)" />
								<span>{option.label}</span>
							</div>
						)}
					/>
				</div>

				{/* Date Range */}
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "4px",
						flex: "1 1 320px",
					})}
				>
					<div
						className={css({
							display: "flex",
							alignItems: "center",
							gap: "4px",
							backgroundColor: "var(--color-bg-tertiary)",
							padding: "0 12px",
							borderRadius: "8px",
							border: "1px solid var(--color-border-primary)",
							height: "36px",
							transition: "border-color 0.2s",
							":focus-within": {
								borderColor: "var(--color-accent-600)",
							},
						})}
					>
						<Calendar size={16} color="var(--color-accent-600)" />
						<input
							type="date"
							value={from}
							onChange={(e) => onFromChange(e.target.value)}
							className={css({
								padding: "4px 8px",
								fontSize: "13px",
								border: "none",
								backgroundColor: "transparent",
								color: "var(--color-text-primary)",
								outline: "none",
								width: "125px",
								cursor: "pointer",
								"::-webkit-calendar-picker-indicator": {
									filter: "invert(0.5)",
									cursor: "pointer",
								},
							})}
						/>
						<span
							className={css({
								color: "var(--color-text-muted)",
								fontSize: "14px",
								margin: "0 4px",
							})}
						>
							—
						</span>
						<input
							type="date"
							value={to}
							onChange={(e) => onToChange(e.target.value)}
							className={css({
								padding: "4px 8px",
								fontSize: "13px",
								border: "none",
								backgroundColor: "transparent",
								color: "var(--color-text-primary)",
								outline: "none",
								width: "125px",
								cursor: "pointer",
								"::-webkit-calendar-picker-indicator": {
									filter: "invert(0.5)",
									cursor: "pointer",
								},
							})}
						/>
					</div>
				</div>

				{/* Clear */}
				{isActive && (
					<Button
						kind={KIND.secondary}
						size={BUTTON_SIZE.compact}
						onClick={onClear}
						className={css({
							marginLeft: "auto",
							borderRadius: "8px",
							height: "36px",
							whiteSpace: "nowrap",
							backgroundColor: "rgba(255, 255, 255, 0.05)",
							":hover": {
								backgroundColor: "rgba(255, 255, 255, 0.1)",
							},
						})}
					>
						<X size={14} className={css({ marginRight: "6px" })} />
						{t("common.clearFilters")}
					</Button>
				)}
			</div>
		</div>
	);
}
