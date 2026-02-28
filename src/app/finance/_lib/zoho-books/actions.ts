'use server';

import {
	getInvoiceDetail,
	getStudentInvoiceSummary,
} from '@finance/_lib/zoho-books';

export async function fetchStudentInvoices(stdNo: number) {
	return getStudentInvoiceSummary(stdNo);
}

export async function fetchInvoiceDetail(invoiceId: string) {
	return getInvoiceDetail(invoiceId);
}
