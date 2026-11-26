export const tagColors = [
	"slate",
	"blue",
	"teal",
	"green",
	"amber",
	"rose",
	"violet",
] as const;

export const tagKinds = ["appointment", "community", "planner"] as const;
export const tagNameMaxLength = 60;
export const tagBatchMaxSize = 100;

export type TagColor = (typeof tagColors)[number];
export type TagKind = (typeof tagKinds)[number];

export interface TagItem {
	kind: TagKind;
	itemId: number;
}

export interface PersonalTag {
	id: number;
	name: string;
	color: TagColor;
	count: number;
}

export interface TagSnapshot {
	tags: PersonalTag[];
	assignments: (TagItem & { tagId: number })[];
}

export function cleanTagName(name: string): string {
	return name.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

export function tagNameKey(name: string): string {
	return cleanTagName(name).toLowerCase();
}
