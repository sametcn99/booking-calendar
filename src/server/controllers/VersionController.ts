import { VersionService } from "../services/VersionService";
import type { ApiResponse } from "../types";

export class VersionController {
	private versionService = new VersionService();

	async getVersionInfo(): Promise<{
		status: number;
		body: ApiResponse;
	}> {
		const data = await this.versionService.getVersionInfo();
		return {
			status: 200,
			body: {
				success: true,
				data,
			},
		};
	}
}
