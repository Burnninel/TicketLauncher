import { setHidden } from "./dom";

export interface IStatusElements {
	cnpjWrapperElement: HTMLElement;
	loadingElement: HTMLElement;
	cnpjErrorElement: HTMLElement;
	cnpjErrorTextElement: HTMLElement;
	companyBadgeElement: HTMLElement;
	companyNameElement: HTMLElement;
	companyDocElement: HTMLElement;
	formElement: HTMLElement;
	inlineErrorElement: HTMLElement;
	inlineErrorTextElement: HTMLElement;
	successElement: HTMLElement;
	successNumberElement: HTMLElement;
}

// Drives the five mutually exclusive body regions (loading / cnpj-error /
// company+form / success) while keeping the CNPJ wrapper persistent across
// all states except success.
export class StatusView {
	private readonly _cnpjWrapper: HTMLElement;
	private readonly _loading: HTMLElement;
	private readonly _cnpjError: HTMLElement;
	private readonly _cnpjErrorText: HTMLElement;
	private readonly _companyBadge: HTMLElement;
	private readonly _companyName: HTMLElement;
	private readonly _companyDoc: HTMLElement;
	private readonly _form: HTMLElement;
	private readonly _inlineError: HTMLElement;
	private readonly _inlineErrorText: HTMLElement;
	private readonly _success: HTMLElement;
	private readonly _successNumber: HTMLElement;

	constructor(elements: IStatusElements) {
		this._cnpjWrapper = elements.cnpjWrapperElement;
		this._loading = elements.loadingElement;
		this._cnpjError = elements.cnpjErrorElement;
		this._cnpjErrorText = elements.cnpjErrorTextElement;
		this._companyBadge = elements.companyBadgeElement;
		this._companyName = elements.companyNameElement;
		this._companyDoc = elements.companyDocElement;
		this._form = elements.formElement;
		this._inlineError = elements.inlineErrorElement;
		this._inlineErrorText = elements.inlineErrorTextElement;
		this._success = elements.successElement;
		this._successNumber = elements.successNumberElement;
	}

	// CNPJ visible, loading dots visible, everything else hidden.
	showLoading(): void {
		this._hideDynamic();
		setHidden(this._cnpjWrapper, false);
		setHidden(this._loading, false);
	}

	// CNPJ visible and locked, company badge + form visible.
	showForm(companyName: string, companyDoc: string): void {
		this._hideDynamic();
		this._companyName.textContent = companyName;
		this._companyDoc.textContent = companyDoc;
		setHidden(this._cnpjWrapper, false);
		setHidden(this._companyBadge, false);
		setHidden(this._form, false);
	}

	// CNPJ visible and editable, error message below it, form hidden.
	showCnpjError(message: string): void {
		this._hideDynamic();
		this._cnpjErrorText.textContent = message;
		setHidden(this._cnpjWrapper, false);
		setHidden(this._cnpjError, false);
	}

	// Success banner only — CNPJ hidden.
	showSuccess(ticketNumber: string): void {
		this._hideDynamic();
		this._successNumber.textContent = ticketNumber;
		setHidden(this._success, false);
	}

	// Inline validation / ticket-creation error within the form.
	showInlineError(message: string): void {
		this._inlineErrorText.textContent = message;
		setHidden(this._inlineError, false);
	}

	clearInlineError(): void {
		setHidden(this._inlineError, true);
	}

	reset(): void {
		this._hideDynamic();
	}

	private _hideDynamic(): void {
		setHidden(this._cnpjWrapper, true);
		setHidden(this._loading, true);
		setHidden(this._cnpjError, true);
		setHidden(this._companyBadge, true);
		setHidden(this._form, true);
		setHidden(this._inlineError, true);
		setHidden(this._success, true);
	}
}
