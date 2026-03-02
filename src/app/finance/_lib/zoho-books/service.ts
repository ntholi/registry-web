import { zohoGet, zohoPost } from './client';
import type {
	CreateStudentContactInput,
	StudentFinanceSummary,
	StudentInvoiceSummary,
	ZohoContact,
	ZohoContactsResponse,
	ZohoCreateContactResponse,
	ZohoCreditNote,
	ZohoCreditNotesResponse,
	ZohoEstimate,
	ZohoEstimatesResponse,
	ZohoInvoice,
	ZohoInvoiceDetailResponse,
	ZohoInvoicesResponse,
	ZohoPayment,
	ZohoPaymentsResponse,
	ZohoSalesReceipt,
	ZohoSalesReceiptsResponse,
} from './types';

export async function findStudentContact(
	stdNo: number
): Promise<ZohoContact | null> {
	const stdNoStr = String(stdNo);

	const response = await zohoGet<ZohoContactsResponse>('/contacts', {
		search_text: stdNoStr,
	});

	const contacts = response.contacts ?? [];
	if (contacts.length === 0) return null;

	return (
		contacts.find((c) => c.cf_account_code === stdNoStr) ??
		contacts.find((c) => c.first_name === stdNoStr) ??
		null
	);
}

export async function findStudentInvoices(
	contactId: string
): Promise<ZohoInvoice[]> {
	const response = await zohoGet<ZohoInvoicesResponse>('/invoices', {
		customer_id: contactId,
		sort_column: 'date',
		sort_order: 'D',
	});
	return response.invoices ?? [];
}

export async function findStudentPayments(
	contactId: string
): Promise<ZohoPayment[]> {
	const response = await zohoGet<ZohoPaymentsResponse>('/customerpayments', {
		customer_id: contactId,
		sort_column: 'date',
		sort_order: 'D',
	});
	return response.customerpayments ?? [];
}

export async function findStudentEstimates(
	contactId: string
): Promise<ZohoEstimate[]> {
	const response = await zohoGet<ZohoEstimatesResponse>('/estimates', {
		customer_id: contactId,
		sort_column: 'date',
		sort_order: 'D',
	});
	return response.estimates ?? [];
}

export async function findStudentSalesReceipts(
	contactId: string
): Promise<ZohoSalesReceipt[]> {
	const response = await zohoGet<ZohoSalesReceiptsResponse>('/salesreceipts', {
		customer_id: contactId,
		sort_column: 'date',
		sort_order: 'D',
	});
	return response.salesreceipts ?? [];
}

export async function findStudentCreditNotes(
	contactId: string
): Promise<ZohoCreditNote[]> {
	const response = await zohoGet<ZohoCreditNotesResponse>('/creditnotes', {
		customer_id: contactId,
		sort_column: 'date',
		sort_order: 'D',
	});
	return response.creditnotes ?? [];
}

export async function getInvoiceDetail(
	invoiceId: string
): Promise<ZohoInvoice> {
	const response = await zohoGet<ZohoInvoiceDetailResponse>(
		`/invoices/${invoiceId}`
	);
	return response.invoice;
}

export async function getStudentInvoiceSummary(
	stdNo: number
): Promise<StudentInvoiceSummary> {
	const contact = await findStudentContact(stdNo);

	if (!contact) {
		return {
			totalInvoices: 0,
			totalAmount: 0,
			totalPaid: 0,
			totalOutstanding: 0,
			invoices: [],
		};
	}

	const invoices = await findStudentInvoices(contact.contact_id);

	const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
	const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
	const totalPaid = totalAmount - totalOutstanding;

	return {
		totalInvoices: invoices.length,
		totalAmount,
		totalPaid,
		totalOutstanding,
		invoices,
	};
}

export async function getStudentFinanceSummary(
	contactId: string
): Promise<StudentFinanceSummary> {
	const [invoices, contact] = await Promise.all([
		findStudentInvoices(contactId),
		zohoGet<{ contact: ZohoContact }>(`/contacts/${contactId}`).then(
			(r) => r.contact
		),
	]);

	const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
	const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
	const totalPaid = totalAmount - totalOutstanding;
	const unusedCredits = contact?.unused_credits_receivable_amount ?? 0;

	return {
		contactId,
		totalAmount,
		totalPaid,
		totalOutstanding,
		unusedCredits,
		invoices,
	};
}

const ACCOUNT_CODE_FIELD_ID = '4172689000000078005';

const TAG_IDS = {
	financialAssistance: '4172689000000000333',
	school: '4172689000000000335',
	programme: '4172689000000000337',
} as const;

const FINANCIAL_ASSISTANCE_OPTIONS: Record<string, string> = {
	ManPower: '4172689000000422009',
	Private: '4172689000000422011',
};

const SCHOOL_OPTIONS: Record<string, string> = {
	FAID: '4172689000000422021',
	FBS: '4172689000000422023',
	FCO: '4172689000000422025',
	FCTH: '4172689000000422027',
	FDSI: '4172689000000422029',
	FFLD: '4172689000000422033',
	FFTB: '4172689000000422035',
	FINT: '4172689000000422037',
};

const PROGRAMME_OPTIONS: Record<string, string> = {
	AV: '4172689000000422059',
	BAFASH: '4172689000000422067',
	BAHR: '4172689000000422069',
	BAS: '4172689000003710011',
	BHR: '4172689000000422089',
	BIB: '4172689000000422091',
	BSCIT: '4172689000000422103',
	CBIT: '4172689000000422115',
	CGD: '4172689000000422117',
	DAT: '4172689000000422125',
	DCAV: '4172689000000422133',
	DEM: '4172689000000422135',
	DFAD: '4172689000000422137',
	DFP: '4172689000000422109',
	DJM: '4172689000000422147',
	DTM: '4172689000000422157',
	RM: '4172689000000422179',
	TM: '4172689000000422169',
};

function buildTags(input: CreateStudentContactInput) {
	const tags: { tag_id: string; tag_option_id: string }[] = [];

	if (input.sponsorName) {
		const key = input.sponsorName === 'Private' ? 'Private' : 'ManPower';
		const optionId = FINANCIAL_ASSISTANCE_OPTIONS[key];
		if (optionId) {
			tags.push({
				tag_id: TAG_IDS.financialAssistance,
				tag_option_id: optionId,
			});
		}
	}

	if (input.schoolCode) {
		const optionId = SCHOOL_OPTIONS[input.schoolCode];
		if (optionId) {
			tags.push({ tag_id: TAG_IDS.school, tag_option_id: optionId });
		}
	}

	if (input.programCode) {
		const optionId = PROGRAMME_OPTIONS[input.programCode];
		if (optionId) {
			tags.push({ tag_id: TAG_IDS.programme, tag_option_id: optionId });
		}
	}

	return tags;
}

export async function createStudentContact(
	input: CreateStudentContactInput
): Promise<ZohoContact> {
	const existing = await findStudentContact(input.stdNo);
	if (existing) return existing;

	const stdNoStr = String(input.stdNo);
	const tags = buildTags(input);

	const body: Record<string, unknown> = {
		contact_name: input.name,
		contact_type: 'customer',
		customer_sub_type: 'business',
		first_name: stdNoStr,
		company_name: input.programName,
		payment_terms: 0,
		payment_terms_label: 'Due on Receipt',
		custom_fields: [
			{
				field_id: ACCOUNT_CODE_FIELD_ID,
				value: stdNoStr,
			},
		],
	};

	if (input.email) body.email = input.email;
	if (input.phone) body.phone = input.phone;
	if (tags.length > 0) body.tags = tags;

	const response = await zohoPost<ZohoCreateContactResponse>('/contacts', body);

	return response.contact;
}
