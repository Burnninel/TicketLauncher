import { HttpClient } from "./http.client";
import { CompanyEntity } from "../domain/entities/company.entity";
import { TicketEntity } from "../domain/entities/ticket.entity";
import { XmlBuilder } from "../shared/xml.builder";
import { Config } from "../shared/config";
import type {
	IBlingCompanyResponse,
	IBlingTicketResponse,
	ITicketResult,
} from "../shared/types";
import { MESSAGES } from "../shared/constants";

export class BlingApi {
	private readonly http: HttpClient;

	constructor() {
		this.http = new HttpClient();
	}

	async findCompanyByCnpj(cnpj: string): Promise<CompanyEntity> {
		const url = `${Config.bling.baseUrl}${Config.bling.endpoints.findCompany}?pesquisa=${cnpj}&pagina=1&habilitarContagem=0&ordem=nome&situacao=Todas&situacaoContrato=Todos&sorteadaMigrar=A`;

		const data = await this.http.get<IBlingCompanyResponse>(url, Config.bling.headers);
		const companies = data.data.data;

		if (companies.length === 0) {
			throw new Error(MESSAGES.error.companyNotFound);
		}

		const first = companies[0];

		if (!first) {
			throw new Error(MESSAGES.error.companyNotFound);
		}

		return new CompanyEntity({ id: first.id, nome: first.nome });
	}

	async createTicket(ticket: TicketEntity): Promise<ITicketResult> {
		const url = `${Config.bling.baseUrl}${Config.bling.endpoints.createTicket}?f=salvarNovoTicket`;
		const body = XmlBuilder.buildRequestBody(ticket);

		const data = await this.http.post<IBlingTicketResponse>(url, body, {
			"Content-Type": "application/x-www-form-urlencoded",
		});

		return {
			ticketNumber: data.numero,
			ticketId: data.id,
		};
	}
}
