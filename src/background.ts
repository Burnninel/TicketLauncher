// Service worker — request proxy to Bling.
//
// The content script runs on callsys.com.br and cannot make authenticated
// cross-origin requests to bling.com.br (CORS blocks them and cookies are
// stripped). The service worker holds full host_permissions and forwards the
// request with the user's session cookies.

interface IProxyMessage {
	type: string;
	url: string;
	method?: string;
	headers?: Record<string, string>;
	body?: string;
}

chrome.runtime.onMessage.addListener((message: IProxyMessage, _sender, sendResponse) => {
	if (message.type !== "BLING_FETCH") return;

	const init: RequestInit = {
		method: message.method ?? "GET",
		headers: message.headers ?? {},
		credentials: "include",
	};
	if (message.body !== undefined) {
		init.body = message.body;
	}

	fetch(message.url, init)
		.then(async (response) => {
			const text = await response.text();
			sendResponse({ ok: response.ok, status: response.status, text });
		})
		.catch((error: unknown) => {
			const reason = error instanceof Error ? error.message : "unknown error";
			sendResponse({ ok: false, status: 0, text: "", error: reason });
		});

	return true; // keep the message channel open for the async response
});
