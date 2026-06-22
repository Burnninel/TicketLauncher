import { CompanyEntity } from "../entities/company.entity";
import { BlingApi } from "../../infrastructure/bling.api";
import { CnpjFormatter } from "../../shared/cnpj.formatter";

export class CompanyUseCase {
	private readonly blingApi: BlingApi;

	constructor() {
		this.blingApi = new BlingApi();
	}

	async fetchCompanyByCnpj(cnpj: string): Promise<CompanyEntity> {
		const cleanCnpj = CnpjFormatter.clean(cnpj);

		if (!CnpjFormatter.isValid(cleanCnpj)) {
			throw new Error(`Invalid CNPJ format: ${cnpj}`);
		}

		return await this.blingApi.findCompanyByCnpj(cleanCnpj);
	}
}
