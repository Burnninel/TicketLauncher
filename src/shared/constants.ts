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

export const MESSAGES = {
	bubble: "Iniciar Atendimento",
	placeholder: "Descreva o atendimento...",
	createButton: "Criar Ticket",
	creating: "Criando...",
	emptyMessage: "⚠️ Digite uma mensagem antes de criar o ticket.",
	companyLabel: (name: string): string => `🏢 ${name}`,
	loading: {
		company: "Buscando empresa...",
		ticket: "Criando ticket...",
	},
	error: {
		cnpjNotFound: "❌ CNPJ não encontrado na tela.",
		companyNotFound: "❌ Nenhuma empresa encontrada para este CNPJ.",
		sessionExpired: "❌ Sessão do Bling expirada. Faça login no Bling.",
		ticketError: "❌ Erro ao criar ticket. Tente novamente.",
		timeout: "❌ Tempo de resposta excedido. Tente novamente.",
		generic: "❌ Erro ao consultar empresa no Bling.",
	},
	success: {
		ticketCreated: (ticketNumber: string): string =>
			`✅ Ticket #${ticketNumber} criado com sucesso!`,
	},
} as const;
