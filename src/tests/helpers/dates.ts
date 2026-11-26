const today = new Date();

export function futureIso(daysAhead: number, hour: number, minute = 0): string {
	const date = new Date(today);
	date.setUTCDate(date.getUTCDate() + daysAhead);
	date.setUTCHours(hour, minute, 0, 0);
	return date.toISOString();
}
