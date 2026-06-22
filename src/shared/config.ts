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
		},
	},
	http: {
		timeoutMs: 10_000,
	},
} as const;
