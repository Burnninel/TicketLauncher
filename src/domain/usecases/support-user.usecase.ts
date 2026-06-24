import { BlingApi } from "../../infrastructure/bling.api";
import type { CompanyEntity } from "../entities/company.entity";
import type { ISupportUserCredentials } from "../../shared/types";

export class SupportUserUseCase {
	private readonly blingApi: BlingApi;

	constructor() {
		this.blingApi = new BlingApi();
	}

	async fetchSupportUserCredentials(company: CompanyEntity): Promise<ISupportUserCredentials> {
		return await this.blingApi.fetchSupportUserCredentials(company.id);
	}
}
