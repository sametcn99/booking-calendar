import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Input } from "baseui/input";
import { Popover } from "baseui/popover";
import { Plus, Tag } from "lucide-react";
import { type FormEvent, useId, useRef, useState } from "react";
import {
	cleanTagName,
	type PersonalTag,
	type TagItem,
	tagNameKey,
	tagNameMaxLength,
} from "../../../../shared/personalTags";
import { useI18n } from "../../context/I18nContext";
import { usePersonalTags } from "../../context/PersonalTagsContext";
import TagPill from "./TagPill";

function TagPickerPanel({
	items,
	action,
	showApplied,
	close,
}: {
	items: TagItem[];
	action: "apply" | "remove";
	showApplied: boolean;
	close: () => void;
}) {
	const [css] = useStyletron();
	const { t } = useI18n();
	const store = usePersonalTags();
	const [query, setQuery] = useState("");
	const firstOption = useRef<HTMLButtonElement>(null);
	const cleanName = cleanTagName(query);
	const key = tagNameKey(query);
	const exact = store.tags.find((tag) => tagNameKey(tag.name) === key);
	const applied = showApplied ? store.tagsFor(items[0], false) : [];
	const assignments = items.map((item) => store.tagsFor(item, false));
	const available = (tag: PersonalTag) =>
		action === "apply"
			? !assignments.every((tags) =>
					tags.some((assigned) => assigned.id === tag.id),
				)
			: assignments.some((tags) =>
					tags.some((assigned) => assigned.id === tag.id),
				);
	const options = store.tags.filter(
		(tag) => tagNameKey(tag.name).includes(key) && available(tag),
	);
	const canCreate =
		action === "apply" &&
		Boolean(cleanName) &&
		cleanName.length <= tagNameMaxLength &&
		!exact;
	const title = t(
		action === "apply" ? "personalTags.add" : "personalTags.remove",
	);
	const showEmpty =
		store.tags.length === 0 || action === "remove" || Boolean(key);

	async function choose(tag: PersonalTag, operation = action) {
		if (await store.changeAssignments(tag, operation, items)) close();
	}

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (store.saving || !store.ready) return;
		if (exact && available(exact)) {
			await choose(exact);
		} else if (canCreate) {
			if (await store.create(cleanName, "slate", items)) close();
		} else if (!key && options.length === 1) {
			await choose(options[0]);
		}
	}

	return (
		<form
			onSubmit={submit}
			aria-label={title}
			aria-busy={store.saving}
			className={css({
				width: "min(320px, calc(100vw - 32px))",
				maxWidth: "100%",
				padding: "12px",
				boxSizing: "border-box",
				display: "grid",
				gap: "8px",
			})}
		>
			<Input
				autoFocus
				aria-label={title}
				placeholder={t(
					action === "apply"
						? "personalTags.searchOrCreate"
						: "personalTags.search",
				)}
				value={query}
				onChange={(event) => setQuery(event.currentTarget.value)}
				onKeyDown={(event) => {
					if (event.key === "ArrowDown" && firstOption.current) {
						event.preventDefault();
						firstOption.current.focus();
					}
				}}
				maxLength={tagNameMaxLength}
				readOnly={store.saving}
				size={SIZE.compact}
			/>
			{exact && action === "apply" && (
				<span
					role="status"
					className={css({
						fontSize: "12px",
						color: "var(--color-text-secondary)",
					})}
				>
					{t("personalTags.duplicate")}
				</span>
			)}
			{applied.length > 0 && (
				<div className={css({ display: "flex", flexWrap: "wrap", gap: "6px" })}>
					{applied.map((tag) => (
						<TagPill
							tag={tag}
							key={tag.id}
							disabled={store.saving}
							onRemove={() => void choose(tag, "remove")}
						/>
					))}
				</div>
			)}
			{options.length > 0 && (
				<div
					className={css({
						display: "grid",
						gap: "4px",
						maxHeight: "180px",
						overflowY: "auto",
					})}
				>
					{options.map((tag, index) => (
						<Button
							key={tag.id}
							ref={index === 0 ? firstOption : undefined}
							type="button"
							kind={KIND.tertiary}
							size={SIZE.compact}
							aria-label={`${title}: ${tag.name}`}
							disabled={store.saving}
							onClick={() => void choose(tag)}
							overrides={{
								BaseButton: {
									style: { justifyContent: "flex-start", minHeight: "44px" },
								},
							}}
						>
							<TagPill tag={tag} />
						</Button>
					))}
				</div>
			)}
			{canCreate && (
				<Button
					type="submit"
					kind={KIND.secondary}
					size={SIZE.compact}
					isLoading={store.saving}
				>
					<Plus size={16} aria-hidden="true" />
					<span
						className={css({
							marginLeft: "6px",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						})}
					>
						{t("personalTags.create")}: {cleanName}
					</span>
				</Button>
			)}
			{showEmpty && options.length === 0 && !canCreate && !exact && (
				<span
					className={css({
						fontSize: "12px",
						color: "var(--color-text-secondary)",
					})}
				>
					{t(
						store.tags.length === 0
							? "personalTags.onboarding"
							: "personalTags.noMatches",
					)}
				</span>
			)}
			{store.saving && <span role="status">{t("personalTags.saving")}</span>}
		</form>
	);
}

export function TagPicker({
	items,
	action = "apply",
	iconOnly = false,
	inline = false,
	showApplied = false,
	label,
}: {
	items: TagItem[];
	action?: "apply" | "remove";
	iconOnly?: boolean;
	inline?: boolean;
	showApplied?: boolean;
	label?: string;
}) {
	const [css] = useStyletron();
	const { t } = useI18n();
	const { ready, saving, savingItem } = usePersonalTags();
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelId = useId();

	function close() {
		setOpen(false);
		if (inline)
			requestAnimationFrame(() =>
				triggerRef.current?.focus({ preventScroll: true }),
			);
	}
	const title = t(
		action === "apply" ? "personalTags.add" : "personalTags.remove",
	);
	const busy = open && saving && items.some(savingItem);

	const trigger = (
		<Button
			ref={triggerRef}
			aria-controls={open ? panelId : undefined}
			type="button"
			kind={KIND.secondary}
			size={SIZE.mini}
			aria-label={label ? `${title}: ${label}` : title}
			title={t("personalTags.private")}
			aria-expanded={open}
			onClick={inline ? () => setOpen(!open) : undefined}
			disabled={!ready || saving || items.length === 0}
			overrides={{
				BaseButton: {
					style: {
						minHeight: iconOnly ? "24px" : "32px",
						minWidth: iconOnly ? "24px" : undefined,
						paddingLeft: iconOnly ? "2px" : "8px",
						paddingRight: iconOnly ? "2px" : "8px",
						paddingTop: "2px",
						paddingBottom: "2px",
						flexShrink: 0,
						"@media (pointer: coarse)": { minHeight: "44px", minWidth: "44px" },
					},
				},
			}}
		>
			{iconOnly ? (
				<Tag size={14} aria-hidden="true" />
			) : (
				<>
					{action === "apply" && <Plus size={14} aria-hidden="true" />}
					<span className={css({ marginLeft: action === "apply" ? "4px" : 0 })}>
						{title}
					</span>
				</>
			)}
		</Button>
	);

	const panel = open ? (
		<div id={panelId}>
			<TagPickerPanel
				items={items}
				action={action}
				showApplied={showApplied}
				close={close}
			/>
		</div>
	) : null;

	if (inline) {
		return (
			<fieldset
				aria-label={title}
				className={css({ border: 0, margin: 0, padding: 0, minWidth: 0 })}
				onKeyDown={(event) => {
					if (event.key === "Escape" && open && !busy) {
						event.stopPropagation();
						close();
					}
				}}
			>
				{trigger}
				{panel}
			</fieldset>
		);
	}

	return (
		<Popover
			isOpen={open}
			content={panel}
			onClick={() => setOpen(!open)}
			placement="bottom"
			autoFocus
			focusLock
			accessibilityType="none"
			onEsc={() => {
				if (!busy) setOpen(false);
			}}
			onClickOutside={() => {
				if (!busy) setOpen(false);
			}}
			overrides={{
				Body: { style: { zIndex: 2100, maxWidth: "calc(100vw - 32px)" } },
			}}
		>
			{trigger}
		</Popover>
	);
}

export function ItemTags({
	item,
	label,
	inline = false,
}: {
	item: TagItem;
	label: string;
	inline?: boolean;
}) {
	const [css] = useStyletron();
	const { t } = useI18n();
	const store = usePersonalTags();
	const busy = store.savingItem(item);
	return (
		<fieldset
			aria-label={t("personalTags.title")}
			aria-busy={busy}
			className={css({
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				gap: "6px",
				minWidth: 0,
				border: 0,
				margin: 0,
				padding: 0,
			})}
		>
			{store.tagsFor(item).map((tag) => (
				<TagPill
					tag={tag}
					key={tag.id}
					animate
					disabled={store.saving}
					onRemove={() => void store.changeAssignments(tag, "remove", [item])}
				/>
			))}
			<TagPicker
				items={[item]}
				showApplied={!inline}
				label={label}
				inline={inline}
			/>
			{busy && (
				<span role="status" className={css({ fontSize: "12px" })}>
					{t("personalTags.saving")}
				</span>
			)}
		</fieldset>
	);
}
