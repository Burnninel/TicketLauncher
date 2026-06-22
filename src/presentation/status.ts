import { MESSAGES } from "../shared/constants";

export interface IStatusElements {
	loadingElement: HTMLElement;
	companyElement: HTMLElement;
	formElement: HTMLElement;
	resultElement: HTMLElement;
}

// Renders the panel states across four regions: loading, company name,
// form and result.
export class StatusView {
	private readonly _loading: HTMLElement;
	private readonly _company: HTMLElement;
	private readonly _form: HTMLElement;
	private readonly _result: HTMLElement;

	constructor({ loadingElement, companyElement, formElement, resultElement }: IStatusElements) {
		this._loading = loadingElement;
		this._company = companyElement;
		this._form = formElement;
		this._result = resultElement;
	}

	showLoading(): void {
		this._hideAll();
		this._loading.hidden = false;
	}

	showCompany(companyName: string): void {
		this._hideAll();
		this._company.textContent = MESSAGES.companyLabel(companyName);
		this._company.hidden = false;
		this._form.hidden = false;
	}

	// Fatal error: replaces the whole panel content with the message.
	showFatalError(message: string): void {
		this._hideAll();
		this._renderResult(message, true);
	}

	// Inline message: keeps company and form visible (validation, creation).
	showInlineMessage(message: string, hasError: boolean): void {
		this._renderResult(message, hasError);
	}

	clearResult(): void {
		this._result.hidden = true;
	}

	reset(): void {
		this._hideAll();
	}

	private _hideAll(): void {
		this._loading.hidden = true;
		this._company.hidden = true;
		this._form.hidden = true;
		this._result.hidden = true;
	}

	private _renderResult(message: string, hasError: boolean): void {
		this._result.hidden = false;
		this._result.className = hasError ? "blg-error" : "blg-success";
		this._result.textContent = message;
	}
}
