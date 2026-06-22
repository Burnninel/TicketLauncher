import { Config } from "../shared/config";

export class CallsysScraper {
	extractCnpj(): string | null {
		const labels = document.querySelectorAll<HTMLElement>(
			Config.callsys.selectors.cnpjLabel
		);

		for (const label of labels) {
			if (label.textContent?.trim() === "CNPJ") {
				const input = label
					.closest(".vs-component")
					?.querySelector<HTMLInputElement>(Config.callsys.selectors.cnpjInput);

				return input?.value ?? null;
			}
		}

		return null;
	}
}
