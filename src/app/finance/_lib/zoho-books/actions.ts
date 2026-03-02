'use server';

import { getSchool } from '@academic/schools/_server/actions';
import { getSponsor } from '@finance/sponsors/_server/actions';
import {
	getStudent,
	saveZohoContactId,
} from '@registry/students/_server/actions';
import {
	createStudentContact,
	findStudentContact,
	findStudentEstimates,
	findStudentPayments,
	findStudentSalesReceipts,
	getInvoiceDetail,
	getStudentFinanceSummary,
} from './service';
import type { CreateStudentContactInput } from './types';

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

export async function createZohoContact(stdNo: number): Promise<string> {
	const student = await getStudent(stdNo);
	if (!student) throw new Error(`Student ${stdNo} not found`);

	const activeProgram = student.programs.find((p) => p.status === 'Active');
	const program = activeProgram ?? student.programs[0];
	const structure = program?.structure;
	const schoolId = structure?.program?.school?.id;

	const latestSemester = program?.semesters?.at(-1);
	const sponsorId = latestSemester?.sponsorId;

	const [school, sponsor] = await Promise.all([
		schoolId ? getSchool(schoolId) : null,
		sponsorId ? getSponsor(sponsorId) : null,
	]);

	const input: CreateStudentContactInput = {
		stdNo,
		name: student.name,
		programName: structure?.program?.name ?? '',
		email: student.user?.email ?? null,
		phone: student.phone1 ?? null,
		schoolCode: school?.code ?? null,
		programCode: structure?.program?.code ?? null,
		sponsorCode: sponsor?.code ?? null,
	};

	const contact = await createStudentContact(input);
	await saveZohoContactId(stdNo, contact.contact_id);
	return contact.contact_id;
}
