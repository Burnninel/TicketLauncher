export class CnpjFormatter {
	static clean(cnpj: string): string {
		return cnpj.replace(/\D/g, "");
	}

	static isValid(cnpj: string): boolean {
		const cleaned = this.clean(cnpj);
		return cleaned.length === 11 || cleaned.length === 14;
	}
}
