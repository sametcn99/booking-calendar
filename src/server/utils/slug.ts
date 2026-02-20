export function generateSlugId(length: number = 8): string {
	const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(bytes)
		.map((value) => alphabet[value % alphabet.length])
		.join("");
}

export async function generateUniqueSlugId(
	existsFn: (slugId: string) => Promise<boolean>,
): Promise<string> {
	for (let attempt = 0; attempt < 10; attempt++) {
		const candidate = generateSlugId();
		const exists = await existsFn(candidate);
		if (!exists) return candidate;
	}

	return `${generateSlugId(6)}${Date.now().toString(36).slice(-2)}`;
}
