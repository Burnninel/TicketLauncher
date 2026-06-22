import type {
	TicketType,
	TicketPriority,
	TicketPhoneCall,
} from "../../shared/types";
import { TICKET_DEFAULTS } from "../../shared/constants";

export interface ITicketEntityParams {
	companyId: number;
	companyName: string;
	message: string;
	type?: TicketType;
	priority?: TicketPriority;
	group?: string;
	subgroup?: string | null;
	ticketProblem?: string;
	functionality?: string | null;
	phoneCall?: TicketPhoneCall;
	chatRecord?: string | null;
	incidentId?: string;
}

export class TicketEntity {
	readonly companyId: number;
	readonly companyName: string;
	readonly message: string;
	readonly type: TicketType;
	readonly priority: TicketPriority;
	readonly group: string;
	readonly subgroup: string | null;
	readonly ticketProblem: string;
	readonly functionality: string | null;
	readonly phoneCall: TicketPhoneCall;
	readonly chatRecord: string | null;
	readonly incidentId: string;

	constructor(params: ITicketEntityParams) {
		this.companyId = params.companyId;
		this.companyName = params.companyName;
		this.message = params.message;
		this.type = params.type ?? (TICKET_DEFAULTS.tipo as TicketType);
		this.priority = params.priority ?? (TICKET_DEFAULTS.prioridade as TicketPriority);
		this.group = params.group ?? TICKET_DEFAULTS.grupo;
		this.subgroup = params.subgroup ?? null;
		this.ticketProblem = params.ticketProblem ?? TICKET_DEFAULTS.ticketProblema;
		this.functionality = params.functionality ?? null;
		this.phoneCall = params.phoneCall ?? (TICKET_DEFAULTS.ligacaoTelefonica as TicketPhoneCall);
		this.chatRecord = params.chatRecord ?? null;
		this.incidentId = params.incidentId ?? "";
	}
}
