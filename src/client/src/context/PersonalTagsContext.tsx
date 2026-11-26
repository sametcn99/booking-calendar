import { toaster } from "baseui/toast";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	cleanTagName,
	type PersonalTag,
	type TagColor,
	type TagItem,
	type TagSnapshot,
} from "../../../shared/personalTags";
import { ApiError, api } from "../api";
import { useI18n } from "./I18nContext";

const emptySnapshot: TagSnapshot = { tags: [], assignments: [] };

function itemKey(item: TagItem) {
	return `${item.kind}:${item.itemId}`;
}

function indexAssignments(snapshot: TagSnapshot) {
	const index = new Map<string, PersonalTag[]>();
	const tags = new Map(snapshot.tags.map((tag) => [tag.id, tag]));
	for (const item of snapshot.assignments) {
		const tag = tags.get(item.tagId);
		if (!tag) continue;
		const key = itemKey(item);
		const existing = index.get(key);
		if (existing) existing.push(tag);
		else index.set(key, [tag]);
	}
	return index;
}

interface PendingAssignment {
	tag: PersonalTag;
	items: TagItem[];
	action: "apply" | "remove";
}

function usePersonalTagsState() {
	const { t } = useI18n();
	const [snapshot, setSnapshot] = useState<TagSnapshot | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [saving, setSaving] = useState(false);
	const [preview, setPreview] = useState<PendingAssignment | null>(null);

	const alive = useRef(false);
	const readVersion = useRef(0);
	const mutation = useRef<Promise<boolean> | null>(null);

	const refresh = useCallback(async () => {
		await mutation.current;
		if (!alive.current) return;
		const version = ++readVersion.current;
		setLoadFailed(false);
		try {
			const result = await api.getPersonalTags();
			if (alive.current && readVersion.current === version) setSnapshot(result);
		} catch {
			if (alive.current && readVersion.current === version) setLoadFailed(true);
		}
	}, []);

	useEffect(() => {
		alive.current = true;
		void refresh();
		return () => {
			alive.current = false;
			readVersion.current++;
		};
	}, [refresh]);

	function save(
		write: () => Promise<TagSnapshot>,
		message: string,
		optimistic: PendingAssignment | null = null,
	) {
		if (mutation.current) return Promise.resolve(false);
		readVersion.current++;
		setSaving(true);
		setPreview(optimistic);

		const result = (async () => {
			try {
				const updated = await write();
				if (alive.current) {
					setSnapshot(updated);
					setLoadFailed(false);
					toaster.positive(t(message), {});
				}
				return true;
			} catch (error) {
				if (alive.current) {
					toaster.negative(
						error instanceof ApiError
							? error.message
							: t("personalTags.saveFailed"),
						{},
					);
				}
				return false;
			} finally {
				mutation.current = null;
				if (alive.current) {
					setPreview(null);
					setSaving(false);
				}
			}
		})();
		mutation.current = result;
		return result;
	}

	const committed = snapshot ?? emptySnapshot;
	const indexed = useMemo(() => indexAssignments(committed), [committed]);
	const pendingItems = new Set(preview?.items.map(itemKey));

	function tagsFor(item: TagItem, optimistic = true) {
		const key = itemKey(item);
		const tags = indexed.get(key) ?? [];
		if (!optimistic || !preview || !pendingItems.has(key)) return tags;

		if (preview.action === "remove") return tags;
		if (tags.some((tag) => tag.id === preview.tag.id)) return tags;
		return [...tags, preview.tag];
	}

	function create(name: string, color: TagColor = "slate", items?: TagItem[]) {
		return save(
			() => api.createPersonalTag({ name, color, items }),
			items ? "personalTags.applied" : "personalTags.created",
			items
				? {
						tag: { id: -1, name: cleanTagName(name), color, count: 0 },
						items,
						action: "apply",
					}
				: null,
		);
	}

	function changeAssignments(
		tag: PersonalTag,
		action: "apply" | "remove",
		items: TagItem[],
	) {
		return save(
			() => api.changePersonalTagAssignments(tag.id, action, items),
			action === "apply" ? "personalTags.applied" : "personalTags.removed",
			{ tag, items, action },
		);
	}

	return {
		tags: committed.tags,
		tagsFor,
		ready: snapshot !== null,
		loadFailed,
		refresh,
		saving,
		savingItem: (item: TagItem) => pendingItems.has(itemKey(item)),
		create,
		changeAssignments,
		update: (id: number, name: string, color: TagColor) =>
			save(
				() => api.updatePersonalTag(id, { name, color }),
				"personalTags.updated",
			),
		remove: (id: number) =>
			save(() => api.deletePersonalTag(id), "personalTags.deleted"),
	};
}

const PersonalTagsContext = createContext<ReturnType<
	typeof usePersonalTagsState
> | null>(null);

export function PersonalTagsProvider({ children }: { children: ReactNode }) {
	const tags = usePersonalTagsState();
	return (
		<PersonalTagsContext.Provider value={tags}>
			{children}
		</PersonalTagsContext.Provider>
	);
}

export function usePersonalTags() {
	const tags = useContext(PersonalTagsContext);
	if (!tags) throw new Error("PersonalTagsProvider is required");
	return tags;
}
