import { zohoGet } from './client';
import type {
	StudentInvoiceSummary,
	ZohoContact,
	ZohoContactsResponse,
	ZohoInvoice,
	ZohoInvoiceDetailResponse,
	ZohoInvoicesResponse,
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
