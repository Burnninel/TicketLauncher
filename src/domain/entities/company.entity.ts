import type { IBlingCompanyData } from "../../shared/types";

export class CompanyEntity {
	readonly id: number;
	readonly name: string;

	constructor({ id, nome }: Pick<IBlingCompanyData, "id" | "nome">) {
		this.id = id;
		this.name = nome;
	}
}
