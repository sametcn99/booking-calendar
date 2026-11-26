import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "baseui/modal";
import { useId, useState } from "react";
import {
	cleanTagName,
	type PersonalTag,
	type TagColor,
	tagColors,
	tagNameKey,
	tagNameMaxLength,
} from "../../../../shared/personalTags";
import { useI18n } from "../../context/I18nContext";
import { usePersonalTags } from "../../context/PersonalTagsContext";
import TagPill from "./TagPill";

export default function ManageTagsDialog({
	startCreating,
	onClose,
}: {
	startCreating: boolean;
	onClose: () => void;
}) {
	const [css] = useStyletron();
	const { locale, t } = useI18n();
	const store = usePersonalTags();
	const titleId = useId();
	const [editing, setEditing] = useState<number | "new" | null>(
		startCreating ? "new" : null,
	);
	const [deleting, setDeleting] = useState<PersonalTag | null>(null);
	const [name, setName] = useState("");
	const [color, setColor] = useState<TagColor>("slate");

	const normalized = cleanTagName(name);
	const duplicate = store.tags.some(
		(tag) =>
			tag.id !== editing && tagNameKey(tag.name) === tagNameKey(normalized),
	);
	const canSave =
		normalized.length > 0 &&
		normalized.length <= tagNameMaxLength &&
		!duplicate;

	function edit(tag?: PersonalTag) {
		setEditing(tag?.id ?? "new");
		setName(tag?.name ?? "");
		setColor(tag?.color ?? "slate");
	}

	const usage = (count: number) =>
		t("personalTags.usage").replace(
			"{count}",
			new Intl.NumberFormat(locale).format(count),
		);

	return (
		<Modal
			isOpen
			onClose={() => {
				if (!store.saving) onClose();
			}}
			closeable={!store.saving}
			overrides={{
				Dialog: {
					props: { "aria-labelledby": titleId, "aria-label": undefined },
					style: { width: "min(520px, calc(100vw - 24px))" },
				},
			}}
		>
			<ModalHeader id={titleId}>{t("personalTags.manage")}</ModalHeader>
			<ModalBody>
				{deleting ? (
					<div role="alert">
						<p className={css({ overflowWrap: "anywhere" })}>
							{t("personalTags.deletePrompt")
								.replace("{count}", String(deleting.count))
								.replace("{name}", () => deleting.name)}
						</p>
						<div
							className={css({ display: "flex", flexWrap: "wrap", gap: "8px" })}
						>
							<Button
								kind={KIND.secondary}
								size={SIZE.compact}
								disabled={store.saving}
								onClick={() => setDeleting(null)}
							>
								{t("common.cancel")}
							</Button>
							<Button
								size={SIZE.compact}
								isLoading={store.saving}
								onClick={async () => {
									if (await store.remove(deleting.id)) setDeleting(null);
								}}
							>
								{t("personalTags.delete")}
							</Button>
						</div>
					</div>
				) : editing !== null ? (
					<form
						onSubmit={async (event) => {
							event.preventDefault();
							if (!canSave || store.saving) return;
							const ok =
								editing === "new"
									? await store.create(name, color)
									: await store.update(editing, name, color);
							if (ok) setEditing(null);
						}}
					>
						<FormControl
							label={t("personalTags.name")}
							error={duplicate ? t("personalTags.duplicate") : undefined}
						>
							<Input
								name="tag-name"
								aria-label={t("personalTags.name")}
								autoFocus
								value={name}
								onChange={(event) => setName(event.currentTarget.value)}
								maxLength={tagNameMaxLength}
								disabled={store.saving}
							/>
						</FormControl>
						<fieldset
							disabled={store.saving}
							className={css({
								border: "none",
								padding: 0,
								margin: "0 0 16px",
								minWidth: 0,
							})}
						>
							<legend>{t("personalTags.color")}</legend>
							<div
								className={css({
									display: "flex",
									flexWrap: "wrap",
									gap: "2px 12px",
									marginTop: "4px",
								})}
							>
								{tagColors.map((option) => (
									<label
										key={option}
										className={css({
											display: "flex",
											alignItems: "center",
											gap: "5px",
											minHeight: "44px",
											cursor: "pointer",
										})}
									>
										<input
											type="radio"
											name="tag-color"
											checked={color === option}
											onChange={() => setColor(option)}
										/>
										<TagPill
											tag={{
												color: option,
												name: t(`personalTags.colors.${option}`),
											}}
										/>
									</label>
								))}
							</div>
						</fieldset>
						<div
							className={css({ display: "flex", flexWrap: "wrap", gap: "8px" })}
						>
							<Button
								type="button"
								kind={KIND.secondary}
								size={SIZE.compact}
								disabled={store.saving}
								onClick={() => setEditing(null)}
							>
								{t("common.cancel")}
							</Button>
							<Button
								type="submit"
								size={SIZE.compact}
								disabled={!canSave}
								isLoading={store.saving}
							>
								{t(
									editing === "new"
										? "personalTags.create"
										: "personalTags.save",
								)}
							</Button>
						</div>
					</form>
				) : (
					<>
						{store.tags.length === 0 ? (
							<p>{t("personalTags.onboarding")}</p>
						) : (
							<ul
								className={css({
									display: "grid",
									gap: "8px",
									listStyle: "none",
									padding: 0,
									margin: "0 0 16px",
								})}
							>
								{store.tags.map((tag) => (
									<li
										key={tag.id}
										className={css({
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											flexWrap: "wrap",
											gap: "6px 12px",
											padding: "8px",
											borderBottom: "1px solid var(--color-border-primary)",
										})}
									>
										<div
											className={css({
												display: "flex",
												alignItems: "center",
												flexWrap: "wrap",
												gap: "6px",
											})}
										>
											<TagPill tag={tag} />
											<span className={css({ fontSize: "13px" })}>
												{usage(tag.count)}
											</span>
										</div>
										<div className={css({ display: "flex", gap: "4px" })}>
											<Button
												kind={KIND.tertiary}
												size={SIZE.compact}
												aria-label={`${t("personalTags.edit")}: ${tag.name}`}
												onClick={() => edit(tag)}
											>
												{t("personalTags.edit")}
											</Button>
											<Button
												kind={KIND.tertiary}
												size={SIZE.compact}
												aria-label={`${t("personalTags.delete")}: ${tag.name}`}
												onClick={() => setDeleting(tag)}
											>
												{t("personalTags.delete")}
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
						<Button
							kind={KIND.secondary}
							size={SIZE.compact}
							onClick={() => edit()}
						>
							{t(
								store.tags.length
									? "personalTags.create"
									: "personalTags.first",
							)}
						</Button>
					</>
				)}
			</ModalBody>
			<ModalFooter>
				<Button
					kind={KIND.tertiary}
					size={SIZE.compact}
					disabled={store.saving}
					onClick={onClose}
				>
					{t("dashboard.calendar.close")}
				</Button>
			</ModalFooter>
		</Modal>
	);
}
