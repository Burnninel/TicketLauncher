import { HttpClient } from "./http.client";
import { Config } from "../shared/config";
import { INTERNAL_ERRORS } from "../shared/constants";
import type { ITicketLinkPayload } from "../shared/types";

export class VoiceTranscriberApi {
	private readonly client: HttpClient;

	constructor(client: HttpClient = new HttpClient()) {
		this.client = client;
	}

	async linkTicket(payload: ITicketLinkPayload): Promise<void> {
		const url = Config.voiceTranscriber.baseUrl + Config.voiceTranscriber.endpoints.linkTicket;
		const token = await this.getIntegrationToken();

		await this.client.post<unknown>(
			url,
			JSON.stringify(payload),
			{
				[Config.voiceTranscriber.headers.contentType]: Config.voiceTranscriber.contentType,
				[Config.voiceTranscriber.headers.integrationToken]: token,
			}
		);
	}

	private async getIntegrationToken(): Promise<string> {
		const key = Config.voiceTranscriber.tokenStorageKey;
		const result = await chrome.storage.local.get(key);
		const stored = result[key];

		if (typeof stored === "string" && stored.trim()) {
			return stored;
		}

		throw new Error(INTERNAL_ERRORS.voiceTranscriberTokenMissing);
	}
}
