import type { IHttpHeaders, IProxyResponse } from "../shared/types";
import { HTTP_TIMEOUT_MS } from "../shared/constants";

// In MV3 a content script cannot perform authenticated cross-origin requests
// (CORS blocks them and cookies are stripped). Every request is delegated to
// the service worker, which holds full host_permissions. See background.ts.
export class HttpClient {
	private readonly timeoutMs: number;

	constructor(timeoutMs: number = HTTP_TIMEOUT_MS) {
		this.timeoutMs = timeoutMs;
	}

	async get<T>(url: string, headers: IHttpHeaders = {}): Promise<T> {
		return this.request<T>("GET", url, undefined, headers);
	}

	async post<T>(url: string, body: string, headers: IHttpHeaders = {}): Promise<T> {
		return this.request<T>("POST", url, body, headers);
	}

	private request<T>(
		method: string,
		url: string,
		body: string | undefined,
		headers: IHttpHeaders
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			let isSettled = false;
			const timeoutId = setTimeout(() => {
				isSettled = true;
				reject(new Error(`Request timeout after ${this.timeoutMs}ms: ${url}`));
			}, this.timeoutMs);

			chrome.runtime.sendMessage(
				{ type: "BLING_FETCH", url, method, headers, body },
				(response: IProxyResponse | undefined) => {
					if (isSettled) return;
					clearTimeout(timeoutId);

					if (chrome.runtime.lastError) {
						reject(new Error(`Service worker messaging failed: ${chrome.runtime.lastError.message}`));
						return;
					}
					if (!response) {
						reject(new Error(`Empty response from service worker: ${url}`));
						return;
					}
					if (!response.ok) {
						reject(new Error(`HTTP error ${response.status} on ${method} ${url}`));
						return;
					}

					try {
						resolve(JSON.parse(response.text) as T);
					} catch {
						reject(new Error(`Invalid JSON response from ${url}`));
					}
				}
			);
		});
	}
}
