import type { TicketEntity } from "../domain/entities/ticket.entity";

export class XmlBuilder {
	static build(ticket: TicketEntity): string {
		return `<xjxobj>
			<e><k>idEmpresa</k><v>${ticket.companyId}</v></e>
			<e><k>idIncidente</k><v>${ticket.incidentId}</v></e>
			<e><k>empresa</k><v>${ticket.companyName}</v></e>
			<e><k>mensagem</k><v>${ticket.message}</v></e>
			<e><k>tipo</k><v>${ticket.type}</v></e>
			<e><k>prioridade</k><v>${ticket.priority}</v></e>
			<e><k>grupo</k><v>${ticket.group}</v></e>
			<e><k>subgrupo</k><v>${ticket.subgroup}</v></e>
			<e><k>ticketProblema</k><v>${ticket.ticketProblem}</v></e>
			<e><k>funcionalidade</k><v>${ticket.functionality}</v></e>
			<e><k>ligacaoTelefonica</k><v>${ticket.phoneCall}</v></e>
			<e><k>registroChat</k><v>${ticket.chatRecord}</v></e>
		</xjxobj>`;
	}

	static buildRequestBody(ticket: TicketEntity): string {
		// xajax protocol: positional, URL-encoded XML args (not JSON).
		const xml = encodeURIComponent(this.build(ticket));
		const timestamp = Date.now();

		return [
			"xajax=salvarNovoTicket",
			`xajaxr=${timestamp}`,
			"xajaxargs[]=0",
			`xajaxargs[]=${xml}`,
			"xajaxargs[]=false",
		].join("&");
	}
}
