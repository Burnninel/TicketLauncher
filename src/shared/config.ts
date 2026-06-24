export const Config = {
	bling: {
		baseUrl: "https://www.bling.com.br",
		endpoints: {
			createTicket: "/services/tickets.server.php",
			findCompany: "/Api/v3/adm-empresas/empresas",
		},
		headers: {
			"x-api-revision": "3.1.0",
		},
	},
	callsys: {
		baseUrl: "https://bling.callsys.com.br",
		selectors: {
			cnpjLabel: ".vs-input--label",
			cnpjInput: ".vs-inputx",
			callIdChip: ".text-chip.vs-chip--text",
		},
	},
	voiceTranscriber: {
		baseUrl: "https://voice-transcriber-api-866701498536.us-central1.run.app",
		endpoints: {
			linkTicket: "/v1/integrations/callsys-ticket",
		},
		headers: {
			contentType: "Content-Type",
			integrationToken: "x-integration-token",
		},
		contentType: "application/json",
		source: "ticketlauncher",
		tokenStorageKey: "voiceTranscriberIntegrationToken",
		// Default usado quando nenhum token foi configurado via settings page.
		// ADR-008: substituir por UI de configuração.
	},
	http: {
		timeoutMs: 10_000,
	},
} as const;
