import { Config } from "../../shared/config";
import type { ITicketLinkPayload, ITicketResult } from "../../shared/types";
import type { CompanyEntity } from "../entities/company.entity";

export interface ITicketLinkGateway {
	linkTicket(payload: ITicketLinkPayload): Promise<void>;
}

interface LinkTicketInput {
	callId: string;
	result: ITicketResult;
	cnpj: string;
	company: CompanyEntity;
}

export class NotifyTranscriberUseCase {
	private readonly gateway: ITicketLinkGateway;

	constructor(gateway: ITicketLinkGateway) {
		this.gateway = gateway;
	}

	async linkTicket({ callId, result, cnpj, company }: LinkTicketInput): Promise<void> {
		await this.gateway.linkTicket({
			callId,
			ticketNumber: result.ticketNumber,
			ticketId: result.ticketId,
			cnpj: cnpj || undefined,
			companyName: company.name || undefined,
			source: Config.voiceTranscriber.source,
		});
	}
}
