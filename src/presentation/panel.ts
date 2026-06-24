import { StatusView } from "./status";
import { MESSAGES } from "../shared/constants";
import { ICONS } from "./icons";
import { setHidden } from "./dom";
import type { SupportUserCopyStatus, TranscriptionStatus } from "../shared/types";

// Single widget: collapsed shows the trigger pill, expanded shows the panel.
// The outer .bl-widget is position:fixed — there is no separate Bubble element.
const WIDGET_TEMPLATE = `
	<button class="bl-widget__trigger" id="bl-trigger" type="button">
		<span class="bl-widget__trigger-icon">${ICONS.ticket}</span>
		<span>${MESSAGES.bubble}</span>
	</button>
	<div class="bl-widget__panel bl-hidden" id="bl-panel-content">
		<div class="bl-panel__header">
			<div class="bl-panel__header-left">
				${ICONS.ticket}
				<p class="bl-panel__title">${MESSAGES.panelTitle}</p>
			</div>
			<button class="bl-panel__close" type="button" id="bl-close-btn" aria-label="${MESSAGES.closeLabel}">
				${ICONS.close}
			</button>
		</div>
		<div class="bl-panel__body">
			<div class="bl-field bl-hidden" id="bl-cnpj-wrapper">
				<div class="bl-field__label">
					${MESSAGES.cnpjLabel}
					<button class="bl-field__edit-link" type="button" id="bl-cnpj-edit">${MESSAGES.cnpjEdit}</button>
				</div>
				<input id="bl-cnpj-input" class="bl-field__input bl-field__input--readonly" value="" readonly />
			</div>

			<div class="bl-loading bl-hidden" id="bl-loading">
				<div class="bl-loading__dots">
					<div class="bl-loading__dot"></div>
					<div class="bl-loading__dot"></div>
					<div class="bl-loading__dot"></div>
				</div>
				<span>${MESSAGES.loading.company}</span>
			</div>

			<div class="bl-error-msg bl-hidden" id="bl-cnpj-error">
				<span class="bl-error-msg__icon">${ICONS.errorCircle}</span>
				<span id="bl-cnpj-error-text"></span>
			</div>

			<div class="bl-company-badge bl-hidden" id="bl-company-badge">
				<div class="bl-company-badge__icon">${ICONS.building}</div>
				<div class="bl-company-badge__details">
					<p class="bl-company-badge__name" id="bl-company-name"></p>
					<p class="bl-company-badge__doc" id="bl-company-doc"></p>
				</div>
				<button
					class="bl-company-badge__copy"
					type="button"
					id="bl-support-user-copy-btn"
					aria-label="${MESSAGES.supportUser.copyLabel}"
					title="${MESSAGES.supportUser.copyLabel}"
				>
					<span class="bl-company-badge__copy-icon">${ICONS.copy}</span>
				</button>
			</div>

			<div class="bl-hidden" id="bl-form">
				<div class="bl-field">
					<div class="bl-field__label">${MESSAGES.descriptionLabel}</div>
					<textarea id="bl-message-input" class="bl-field__input" placeholder="${MESSAGES.placeholder}"></textarea>
				</div>
				<div class="bl-error-msg bl-hidden" id="bl-inline-error" style="margin-top: 8px !important">
					<span class="bl-error-msg__icon">${ICONS.errorCircle}</span>
					<span id="bl-inline-error-text"></span>
				</div>
				<div class="bl-divider" style="margin: 12px 0 !important"></div>
				<button class="bl-btn-primary" type="button" id="bl-create-btn" disabled>${MESSAGES.createButton}</button>
			</div>

			<div class="bl-hidden" id="bl-success">
				<div class="bl-success-banner">
					<div class="bl-success-banner__icon">${ICONS.check}</div>
					<div>
						<p class="bl-success-banner__number" id="bl-ticket-number"></p>
						<p class="bl-success-banner__sub">${MESSAGES.success.sub}</p>
						<p class="bl-success-banner__transcription" id="bl-transcription-status"></p>
					</div>
				</div>
				<button class="bl-btn-secondary" type="button" id="bl-new-btn" style="margin-top: 12px !important">${MESSAGES.createAnother}</button>
			</div>
		</div>
	</div>
`;

export class Panel {
	private readonly _element: HTMLDivElement;
	private readonly _trigger: HTMLButtonElement;
	private readonly _panelContent: HTMLDivElement;
	private readonly _cnpjInput: HTMLInputElement;
	private readonly _cnpjEdit: HTMLButtonElement;
	private readonly _messageInput: HTMLTextAreaElement;
	private readonly _createButton: HTMLButtonElement;
	private readonly _supportUserCopyButton: HTMLButtonElement;
	private readonly _status: StatusView;

	private _currentCompanyId: number | null = null;

	private _triggerHandler: (() => void) | null = null;
	private _closeHandler: (() => void) | null = null;
	private _cnpjConfirmHandler: ((cnpj: string) => void) | null = null;
	private _supportUserCopyHandler: (() => void) | null = null;
	private _supportUserCopyResetTimer: number | null = null;

	constructor() {
		this._element = document.createElement("div");
		this._element.className = "bl-widget";
		this._element.innerHTML = WIDGET_TEMPLATE;
		// Clicks anywhere inside the widget must not reach the document
		// click-outside listener that closes the panel.
		this._element.addEventListener("click", (e) => e.stopPropagation());

		this._trigger = this._query<HTMLButtonElement>("#bl-trigger");
		this._panelContent = this._query<HTMLDivElement>("#bl-panel-content");
		this._cnpjInput = this._query<HTMLInputElement>("#bl-cnpj-input");
		this._cnpjEdit = this._query<HTMLButtonElement>("#bl-cnpj-edit");
		this._messageInput = this._query<HTMLTextAreaElement>("#bl-message-input");
		this._createButton = this._query<HTMLButtonElement>("#bl-create-btn");
		this._supportUserCopyButton = this._query<HTMLButtonElement>("#bl-support-user-copy-btn");

		this._status = new StatusView({
			cnpjWrapperElement: this._query("#bl-cnpj-wrapper"),
			loadingElement: this._query("#bl-loading"),
			cnpjErrorElement: this._query("#bl-cnpj-error"),
			cnpjErrorTextElement: this._query("#bl-cnpj-error-text"),
			companyBadgeElement: this._query("#bl-company-badge"),
			companyNameElement: this._query("#bl-company-name"),
			companyDocElement: this._query("#bl-company-doc"),
			formElement: this._query("#bl-form"),
			inlineErrorElement: this._query("#bl-inline-error"),
			inlineErrorTextElement: this._query("#bl-inline-error-text"),
			successElement: this._query("#bl-success"),
			successNumberElement: this._query("#bl-ticket-number"),
			successTranscriptionElement: this._query("#bl-transcription-status"),
		});

		this._trigger.addEventListener("click", () => this._triggerHandler?.());
		this._query<HTMLButtonElement>("#bl-close-btn").addEventListener("click", () => this._closeHandler?.());
		this._query<HTMLButtonElement>("#bl-new-btn").addEventListener("click", () => this._reset());
		this._supportUserCopyButton.addEventListener("click", () => this._supportUserCopyHandler?.());
		this._setupCnpjToggle();
	}

	get element(): HTMLDivElement {
		return this._element;
	}

	get isOpen(): boolean {
		return !this._panelContent.classList.contains("bl-hidden");
	}

	open(cnpj: string): void {
		setHidden(this._trigger, true);
		setHidden(this._panelContent, false);
		this._setCnpj(cnpj);
		this._status.showLoading();
	}

	close(): void {
		setHidden(this._panelContent, true);
		setHidden(this._trigger, false);
		this._status.reset();
		this.setSupportUserCopyState("idle");
		this._lockCnpj();
	}

	showLoading(): void {
		this._lockCnpj();
		this._status.showLoading();
	}

	showCompany(companyName: string, cnpj: string, companyId: number): void {
		this._currentCompanyId = companyId;
		this._setCnpj(cnpj);
		this._lockCnpj();
		this._messageInput.value = MESSAGES.defaults.ticketDescription;
		this._status.showForm(companyName, cnpj, companyId);
		this.setSupportUserCopyState("idle");
		this._resetCreateButton();
		this._messageInput.focus();
	}

	showCompanyError(message: string): void {
		this._unlockCnpj();
		this._status.showCnpjError(message);
	}

	showInlineError(message: string): void {
		this._status.showInlineError(message);
		this._resetCreateButton();
	}

	showCreating(): void {
		this._createButton.disabled = true;
		this._createButton.textContent = MESSAGES.creating;
		this._status.clearInlineError();
	}

	showTicketCreated(ticketNumber: string, transcriptionStatus: TranscriptionStatus = "pending"): void {
		this._status.showSuccess(MESSAGES.success.ticketNumber(ticketNumber), transcriptionStatus);
	}

	showTranscriptionStatus(status: TranscriptionStatus): void {
		this._status.showTranscriptionStatus(status);
	}

	getMessage(): string {
		return this._messageInput.value;
	}

	onTrigger(handler: () => void): void {
		this._triggerHandler = handler;
	}

	onSubmit(handler: () => void): void {
		this._createButton.addEventListener("click", handler);
	}

	onClose(handler: () => void): void {
		this._closeHandler = handler;
	}

	onCnpjConfirm(handler: (cnpj: string) => void): void {
		this._cnpjConfirmHandler = handler;
	}

	onSupportUserCopy(handler: () => void): void {
		this._supportUserCopyHandler = handler;
	}

	setSupportUserCopyState(status: SupportUserCopyStatus): void {
		if (this._supportUserCopyResetTimer !== null) {
			window.clearTimeout(this._supportUserCopyResetTimer);
			this._supportUserCopyResetTimer = null;
		}

		const state = this._getSupportUserCopyState(status);
		this._supportUserCopyButton.disabled = status === "copying";
		this._supportUserCopyButton.title = state.label;
		this._supportUserCopyButton.setAttribute("aria-label", state.label);
		this._supportUserCopyButton.classList.remove(
			"bl-company-badge__copy--copying",
			"bl-company-badge__copy--copied",
			"bl-company-badge__copy--error"
		);
		if (status !== "idle") {
			this._supportUserCopyButton.classList.add(`bl-company-badge__copy--${status}`);
		}
		this._supportUserCopyButton.innerHTML =
			`<span class="bl-company-badge__copy-icon">${state.icon}</span>`;

		if (status === "copied" || status === "error") {
			this._supportUserCopyResetTimer = window.setTimeout(() => {
				this.setSupportUserCopyState("idle");
			}, 1800);
		}
	}

	// Resets the panel to form state so the user can create another ticket
	// without re-fetching (currentCompany stays valid in content.ts).
	private _reset(): void {
		this._messageInput.value = MESSAGES.defaults.ticketDescription;
		this._status.showForm(
			this._query<HTMLElement>("#bl-company-name").textContent ?? "",
			this._cnpjInput.value,
			this._currentCompanyId ?? 0
		);
		this.setSupportUserCopyState("idle");
		this._resetCreateButton();
		this._messageInput.focus();
	}

	private _getSupportUserCopyState(status: SupportUserCopyStatus): { icon: string; label: string } {
		if (status === "copying") {
			return { icon: ICONS.copy, label: MESSAGES.supportUser.copyingLabel };
		}
		if (status === "copied") {
			return { icon: ICONS.check, label: MESSAGES.supportUser.copiedLabel };
		}
		if (status === "error") {
			return { icon: ICONS.errorCircle, label: MESSAGES.supportUser.errorLabel };
		}
		return { icon: ICONS.copy, label: MESSAGES.supportUser.copyLabel };
	}

	private _setupCnpjToggle(): void {
		this._cnpjEdit.addEventListener("click", () => {
			const isLocked = this._cnpjInput.readOnly;
			if (isLocked) {
				this._unlockCnpj();
			} else {
				this._lockCnpj();
				this._cnpjConfirmHandler?.(this._cnpjInput.value);
			}
		});
	}

	private _setCnpj(cnpj: string): void {
		this._cnpjInput.value = cnpj;
	}

	private _lockCnpj(): void {
		this._cnpjInput.readOnly = true;
		this._cnpjInput.classList.add("bl-field__input--readonly");
		this._cnpjEdit.textContent = MESSAGES.cnpjEdit;
	}

	private _unlockCnpj(): void {
		this._cnpjInput.readOnly = false;
		this._cnpjInput.classList.remove("bl-field__input--readonly");
		this._cnpjEdit.textContent = MESSAGES.cnpjConfirm;
		this._cnpjInput.focus();
	}

	private _resetCreateButton(): void {
		this._createButton.disabled = false;
		this._createButton.textContent = MESSAGES.createButton;
	}

	private _query<T extends HTMLElement>(selector: string): T {
		const found = this._element.querySelector<T>(selector);
		if (!found) throw new Error(`Widget element not found: ${selector}`);
		return found;
	}
}
