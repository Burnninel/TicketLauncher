// Bling API — company search response
export interface IBlingCompanyData {
	id: number;
	nome: string;
	tipo: string;
	situacao: number;
	descricaoSituacao: string;
	email: string;
	login: string;
	descricaoPlano: string;
	dataInscricao: string;
	dataUltimoLogin: string;
}

export interface IBlingCompanyResponse {
	data: {
		data: IBlingCompanyData[];
		paginacao: {
			registrosPagina: number;
			totalRegistros: number;
		};
	};
}

// Bling API — ticket creation response
export interface IBlingTicketResponse {
	status: "success" | "error";
	numero: string;
	id: string;
}

// Ticket creation result
export interface ITicketResult {
	ticketNumber: string;
	ticketId: string;
}

// Ticket payload fields
export type TicketType = "D" | "S" | "N";
export type TicketPriority = "N" | "A" | "U";
export type TicketPhoneCall = "S" | "N";

// HTTP client
export interface IHttpHeaders {
	[key: string]: string;
}

export interface IHttpError {
	status: number;
	message: string;
}

// Proxy response returned by the service worker (see background.ts)
export interface IProxyResponse {
	ok: boolean;
	status: number;
	text: string;
	error?: string;
}

// VoiceTranscriber integration payload
export interface ITicketLinkPayload {
	callId: string;
	ticketNumber: string;
	ticketId: string;
	cnpj?: string | undefined;
	companyName?: string | undefined;
	source: "ticketlauncher";
}

// Status panel states
export type PanelState =
	| "idle"
	| "loading-company"
	| "company-found"
	| "loading-ticket"
	| "success"
	| "error";
