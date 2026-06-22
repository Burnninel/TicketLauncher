import { MESSAGES } from "../shared/constants";

export class Bubble {
	private readonly _element: HTMLButtonElement;

	constructor() {
		this._element = document.createElement("button");
		this._element.id = "blg-ticket-bubble";
		this._element.type = "button";
		this._element.textContent = MESSAGES.bubble;
	}

	get element(): HTMLButtonElement {
		return this._element;
	}

	onClick(handler: (event: MouseEvent) => void): void {
		this._element.addEventListener("click", (event) => {
			event.stopPropagation();
			handler(event);
		});
	}
}
