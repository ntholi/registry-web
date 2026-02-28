import { zohoGet } from './client';
import type {
	StudentFinanceSummary,
	StudentInvoiceSummary,
	ZohoContact,
	ZohoContactsResponse,
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
	stdNo: number
): Promise<StudentFinanceSummary | null> {
	const contact = await findStudentContact(stdNo);

	if (!contact) return null;

	const [invoices, payments, estimates, salesReceipts, creditNotes] =
		await Promise.all([
			findStudentInvoices(contact.contact_id),
			findStudentPayments(contact.contact_id),
			findStudentEstimates(contact.contact_id),
			findStudentSalesReceipts(contact.contact_id),
			findStudentCreditNotes(contact.contact_id),
		]);

	const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
	const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
	const totalPaid = totalAmount - totalOutstanding;
	const unusedCredits = contact.unused_credits_receivable_amount ?? 0;

	return {
		contactId: contact.contact_id,
		totalAmount,
		totalPaid,
		totalOutstanding,
		unusedCredits,
		invoices,
		payments,
		estimates,
		salesReceipts,
		creditNotes,
	};
}
