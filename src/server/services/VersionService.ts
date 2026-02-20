import { config } from "../config";

interface GithubRelease {
	tag_name: string;
	html_url: string;
}

export interface VersionInfo {
	current_version: string;
	latest_release_version: string | null;
	latest_release_url: string | null;
	update_available: boolean;
}

function normalizeVersion(version: string): string {
	return version.trim().replace(/^v/i, "");
}

function parseSemver(version: string): number[] | null {
	const normalized = normalizeVersion(version);
	const match = normalized.match(/^(\d+)\.(\d+)\.(\d+)$/);
	if (!match) return null;
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isVersionGreater(a: string, b: string): boolean {
	const parsedA = parseSemver(a);
	const parsedB = parseSemver(b);
	if (!parsedA || !parsedB) return false;

	for (let i = 0; i < 3; i++) {
		if (parsedA[i] > parsedB[i]) return true;
		if (parsedA[i] < parsedB[i]) return false;
	}

	return false;
}

export class VersionService {
	async getVersionInfo(): Promise<VersionInfo> {
		const currentVersion = config.app.version;
		const releasesUrl = `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/releases?per_page=1`;

		try {
			const response = await fetch(releasesUrl, {
				headers: {
					Accept: "application/vnd.github+json",
					"User-Agent": "booking-calendar",
				},
			});

			if (!response.ok) {
				return {
					current_version: currentVersion,
					latest_release_version: null,
					latest_release_url: null,
					update_available: false,
				};
			}

			const releases = (await response.json()) as GithubRelease[];
			const latestRelease = releases[0];
			if (!latestRelease) {
				return {
					current_version: currentVersion,
					latest_release_version: null,
					latest_release_url: null,
					update_available: false,
				};
			}

			const latestVersion = normalizeVersion(latestRelease.tag_name);
			return {
				current_version: currentVersion,
				latest_release_version: latestVersion,
				latest_release_url: latestRelease.html_url,
				update_available: isVersionGreater(latestVersion, currentVersion),
			};
		} catch {
			return {
				current_version: currentVersion,
				latest_release_version: null,
				latest_release_url: null,
				update_available: false,
			};
		}
	}
}
