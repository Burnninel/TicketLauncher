export const TICKET_DEFAULTS = {
	tipo: "D",
	prioridade: "N",
	grupo: "8",
	subgrupo: null,
	ticketProblema: "561",
	funcionalidade: null,
	ligacaoTelefonica: "S",
	registroChat: null,
	idIncidente: "",
} as const;

export const HTTP_TIMEOUT_MS = 10_000;

export const LOG_MESSAGES = {
	voiceTranscriberNotifyFailed: "[TicketLauncher] VoiceTranscriber notify failed:",
} as const;

export const INTERNAL_ERRORS = {
	voiceTranscriberTokenMissing: "VoiceTranscriber integration token is not configured.",
} as const;

export const MESSAGES = {
	bubble: "Novo ticket",
	panelTitle: "Novo ticket de suporte",
	closeLabel: "Fechar painel",
	cnpjLabel: "CNPJ / CPF",
	cnpjEdit: "Alterar",
	cnpjConfirm: "Confirmar",
	descriptionLabel: "Descrição",
	placeholder: "Descreva o atendimento...",
	createButton: "Criar ticket",
	creating: "Criando...",
	createAnother: "Criar outro ticket",
	emptyMessage: "Digite uma descrição antes de criar o ticket.",
	loading: {
		company: "Buscando empresa...",
		ticket: "Criando ticket...",
	},
	error: {
		cnpjNotFound: "CNPJ não encontrado na tela.",
		companyNotFound: "Nenhuma empresa encontrada para este CNPJ.",
		sessionExpired: "Sessão do Bling expirada. Faça login no Bling.",
		ticketError: "Erro ao criar ticket. Tente novamente.",
		timeout: "Tempo de resposta excedido. Tente novamente.",
		generic: "Erro ao consultar empresa no Bling.",
	},
	success: {
		ticketNumber: (ticketNumber: string): string => `Ticket #${ticketNumber}`,
		sub: "Criado com sucesso",
	},
	defaults: {
		ticketDescription: "Registro de atendimento telefônico",
	},
} as const;
