import { Panel } from "./presentation/panel";
import { CompanyUseCase } from "./domain/usecases/company.usecase";
import { TicketUseCase } from "./domain/usecases/ticket.usecase";
import { NotifyTranscriberUseCase } from "./domain/usecases/notify-transcriber.usecase";
import { SupportUserUseCase } from "./domain/usecases/support-user.usecase";
import { CallsysScraper } from "./infrastructure/callsys.scraper";
import { VoiceTranscriberApi } from "./infrastructure/voicetranscriber.api";
import { LOG_MESSAGES, MESSAGES } from "./shared/constants";
import type { CompanyEntity } from "./domain/entities/company.entity";
import type { ISupportUserCredentials, ITicketResult, TranscriptionStatus } from "./shared/types";

const panel = new Panel();
const scraper = new CallsysScraper();
const companyUseCase = new CompanyUseCase();
const ticketUseCase = new TicketUseCase();
const notifyTranscriberUseCase = new NotifyTranscriberUseCase(new VoiceTranscriberApi());
const supportUserUseCase = new SupportUserUseCase();

document.body.appendChild(panel.element);

let currentCompany: CompanyEntity | null = null;
let currentCnpj = "";

panel.onTrigger(() => {
	if (panel.isOpen) {
		closePanel();
	} else {
		void loadCompany();
	}
});

panel.onClose(() => closePanel());
panel.onSubmit(() => void submitTicket());
panel.onCnpjConfirm((cnpj) => void fetchCompany(cnpj));
panel.onSupportUserCopy(() => void copySupportUser());

document.addEventListener("click", () => {
	if (panel.isOpen) closePanel();
});

function closePanel(): void {
	panel.close();
	currentCompany = null;
	currentCnpj = "";
}

async function loadCompany(): Promise<void> {
	currentCompany = null;
	const cnpj = scraper.extractCnpj() ?? "";
	panel.open(cnpj);
	await fetchCompany(cnpj);
}

async function fetchCompany(cnpj: string): Promise<void> {
	panel.showLoading();
	try {
		currentCompany = await companyUseCase.fetchCompanyByCnpj(cnpj);
		currentCnpj = cnpj;
		panel.showCompany(currentCompany.name, cnpj, currentCompany.id);
	} catch (error: unknown) {
		currentCompany = null;
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
		const transcriptionStatus = await notifyTranscriber(result, currentCompany);
		panel.showTranscriptionStatus(transcriptionStatus);
	} catch {
		panel.showInlineError(MESSAGES.error.ticketError);
	}
}

async function notifyTranscriber(result: ITicketResult, company: CompanyEntity): Promise<TranscriptionStatus> {
	const callId = scraper.extractCallId();
	if (!callId) return "not-sent";

	try {
		await notifyTranscriberUseCase.linkTicket({ callId, result, cnpj: currentCnpj, company });
		return "sent";
	} catch (err: unknown) {
		console.warn(LOG_MESSAGES.voiceTranscriberNotifyFailed, err);
		return "not-sent";
	}
}

async function copySupportUser(): Promise<void> {
	const company = currentCompany;
	if (!company) {
		panel.setSupportUserCopyState("error");
		return;
	}

	panel.setSupportUserCopyState("copying");

	try {
		const credentials = await supportUserUseCase.fetchSupportUserCredentials(company);
		await writeToClipboard(formatSupportUserCredentials(credentials));
		panel.setSupportUserCopyState("copied");
	} catch (err: unknown) {
		const reason = err instanceof Error ? err.message : "unknown error";
		console.warn(LOG_MESSAGES.supportUserCopyFailed, reason);
		panel.setSupportUserCopyState("error");
	}
}

function formatSupportUserCredentials(credentials: ISupportUserCredentials): string {
	return `${credentials.login} ${credentials.password}`;
}

async function writeToClipboard(text: string): Promise<void> {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("readonly", "true");
	textarea.style.position = "fixed";
	textarea.style.opacity = "0";
	textarea.style.pointerEvents = "none";
	document.body.appendChild(textarea);
	textarea.select();
	const didCopy = document.execCommand("copy");
	textarea.remove();

	if (!didCopy) {
		throw new Error("Clipboard copy failed.");
	}
}

function toCompanyErrorMessage(error: unknown): string {
	if (!(error instanceof Error)) return MESSAGES.error.generic;

	const text = error.message;
	if (text.includes("timeout")) return MESSAGES.error.timeout;
	if (text.includes("401")) return MESSAGES.error.sessionExpired;
	if (text === MESSAGES.error.companyNotFound) return text;
	return MESSAGES.error.generic;
}
