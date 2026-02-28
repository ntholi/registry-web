'use server';

import {
	getInvoiceDetail,
	getStudentFinanceSummary,
	getStudentInvoiceSummary,
} from '@finance/_lib/zoho-books';

export async function fetchStudentInvoices(stdNo: number) {
	return getStudentInvoiceSummary(stdNo);
}

export async function fetchInvoiceDetail(invoiceId: string) {
	return getInvoiceDetail(invoiceId);
}

export async function fetchStudentFinance(stdNo: number) {
	return getStudentFinanceSummary(stdNo);
}
