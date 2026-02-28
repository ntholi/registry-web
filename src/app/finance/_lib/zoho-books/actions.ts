'use server';

import { saveZohoContactId } from '@registry/students/_server/actions';
import {
	findStudentContact,
	findStudentEstimates,
	findStudentPayments,
	findStudentSalesReceipts,
	getInvoiceDetail,
	getStudentFinanceSummary,
} from './service';

export async function resolveZohoContactId(
	stdNo: number,
	existingId: string | null | undefined
): Promise<string | null> {
	if (existingId) return existingId;

	const contact = await findStudentContact(stdNo);
	if (!contact) return null;

	await saveZohoContactId(stdNo, contact.contact_id);
	return contact.contact_id;
}

export async function fetchStudentFinance(contactId: string) {
	return getStudentFinanceSummary(contactId);
}

export async function fetchStudentPayments(contactId: string) {
	return findStudentPayments(contactId);
}

export async function fetchStudentEstimates(contactId: string) {
	return findStudentEstimates(contactId);
}

export async function fetchStudentSalesReceipts(contactId: string) {
	return findStudentSalesReceipts(contactId);
}

export async function fetchInvoiceDetail(invoiceId: string) {
	return getInvoiceDetail(invoiceId);
}
