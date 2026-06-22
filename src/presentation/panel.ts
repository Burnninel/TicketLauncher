import { StatusView } from "./status";
import { MESSAGES } from "../shared/constants";

const PANEL_TEMPLATE = `
	<div id="blg-ticket-loading" hidden>
		<div class="blg-spinner"></div>
		<span>${MESSAGES.loading.company}</span>
	</div>
	<div id="blg-ticket-company" hidden></div>
	<div id="blg-ticket-form" hidden>
		<textarea id="blg-ticket-msg" placeholder="${MESSAGES.placeholder}"></textarea>
		<button id="blg-ticket-submit" type="button">${MESSAGES.createButton}</button>
	</div>
	<div id="blg-ticket-result" hidden></div>
`;

export class Panel {
	private readonly _element: HTMLDivElement;
	private readonly _messageInput: HTMLTextAreaElement;
	private readonly _submitButton: HTMLButtonElement;
	private readonly _status: StatusView;

	constructor() {
		this._element = document.createElement("div");
		this._element.id = "blg-ticket-panel";
		this._element.hidden = true;
		this._element.innerHTML = PANEL_TEMPLATE;
		// Clicks inside the panel must not close it.
		this._element.addEventListener("click", (event) => event.stopPropagation());

		this._messageInput = this._element.querySelector<HTMLTextAreaElement>("#blg-ticket-msg")!;
		this._submitButton = this._element.querySelector<HTMLButtonElement>("#blg-ticket-submit")!;

		this._status = new StatusView({
			loadingElement: this._element.querySelector<HTMLElement>("#blg-ticket-loading")!,
			companyElement: this._element.querySelector<HTMLElement>("#blg-ticket-company")!,
			formElement: this._element.querySelector<HTMLElement>("#blg-ticket-form")!,
			resultElement: this._element.querySelector<HTMLElement>("#blg-ticket-result")!,
		});
	}

	get element(): HTMLDivElement {
		return this._element;
	}

	get isOpen(): boolean {
		return !this._element.hidden;
	}

	open(): void {
		this._element.hidden = false;
	}

	close(): void {
		this._element.hidden = true;
		this._status.reset();
	}

	onSubmit(handler: () => void): void {
		this._submitButton.addEventListener("click", handler);
	}

	getMessage(): string {
		return this._messageInput.value;
	}

	showLoading(): void {
		this._status.showLoading();
	}

	showCompany(companyName: string): void {
		this._status.showCompany(companyName);
		this._messageInput.value = "";
		this._resetSubmitButton();
		this._messageInput.focus();
	}

	showCompanyError(message: string): void {
		this._status.showFatalError(message);
	}

	showInlineError(message: string): void {
		this._status.showInlineMessage(message, true);
		this._resetSubmitButton();
	}

	showCreating(): void {
		this._submitButton.disabled = true;
		this._submitButton.textContent = MESSAGES.creating;
		this._status.clearResult();
	}

	showTicketCreated(ticketNumber: string): void {
		this._status.showInlineMessage(MESSAGES.success.ticketCreated(ticketNumber), false);
		this._messageInput.value = "";
		setTimeout(() => this._resetSubmitButton(), 3000);
	}

	private _resetSubmitButton(): void {
		this._submitButton.disabled = false;
		this._submitButton.textContent = MESSAGES.createButton;
	}
}
