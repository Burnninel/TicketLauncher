import { TicketEntity } from "../entities/ticket.entity";
import { CompanyEntity } from "../entities/company.entity";
import { BlingApi } from "../../infrastructure/bling.api";
import type { ITicketResult } from "../../shared/types";

export class TicketUseCase {
	private readonly blingApi: BlingApi;

	constructor() {
		this.blingApi = new BlingApi();
	}

	async createTicket(company: CompanyEntity, message: string): Promise<ITicketResult> {
		const ticket = new TicketEntity({
			companyId: company.id,
			companyName: company.name,
			message,
		});

		return await this.blingApi.createTicket(ticket);
	}
}
