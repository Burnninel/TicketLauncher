import { Bubble } from "./presentation/bubble";
import { Panel } from "./presentation/panel";
import { CompanyUseCase } from "./domain/usecases/company.usecase";
import { TicketUseCase } from "./domain/usecases/ticket.usecase";
import { CallsysScraper } from "./infrastructure/callsys.scraper";
import { MESSAGES } from "./shared/constants";
import type { CompanyEntity } from "./domain/entities/company.entity";

const bubble = new Bubble();
const panel = new Panel();
const scraper = new CallsysScraper();
const companyUseCase = new CompanyUseCase();
const ticketUseCase = new TicketUseCase();

document.body.appendChild(panel.element);
document.body.appendChild(bubble.element);

let currentCompany: CompanyEntity | null = null;

bubble.onClick(() => {
	if (panel.isOpen) {
		closePanel();
	} else {
		void loadCompany();
	}
});

panel.onSubmit(() => void submitTicket());

document.addEventListener("click", () => {
	if (panel.isOpen) closePanel();
});

function closePanel(): void {
	panel.close();
	currentCompany = null;
}

async function loadCompany(): Promise<void> {
	currentCompany = null;
	panel.open();

	const cnpj = scraper.extractCnpj();
	if (!cnpj) {
		panel.showCompanyError(MESSAGES.error.cnpjNotFound);
		return;
	}

	panel.showLoading();
	try {
		currentCompany = await companyUseCase.fetchCompanyByCnpj(cnpj);
		panel.showCompany(currentCompany.name);
	} catch (error: unknown) {
		panel.showCompanyError(toCompanyErrorMessage(error));
	}
}

async function submitTicket(): Promise<void> {
	const message = panel.getMessage().trim();
	if (!message) {
		panel.showInlineError(MESSAGES.emptyMessage);
		return;
	}
	if (!currentCompany) {
		panel.showInlineError(MESSAGES.error.generic);
		return;
	}

	panel.showCreating();
	try {
		const result = await ticketUseCase.createTicket(currentCompany, message);
		panel.showTicketCreated(result.ticketNumber);
	} catch {
		panel.showInlineError(MESSAGES.error.ticketError);
	}
}

// Maps the (mostly English) thrown errors to a friendly Portuguese message,
// preserving the previous user-facing behavior.
function toCompanyErrorMessage(error: unknown): string {
	if (!(error instanceof Error)) return MESSAGES.error.generic;

	const text = error.message;
	if (text.includes("timeout")) return MESSAGES.error.timeout;
	if (text.includes("401")) return MESSAGES.error.sessionExpired;
	if (text === MESSAGES.error.companyNotFound) return text;
	return MESSAGES.error.generic;
}
