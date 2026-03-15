'use server';

import { getSchool } from '@academic/schools/_server/actions';
import { getSponsor } from '@finance/sponsors/_server/actions';
import {
	getStudent,
	saveZohoContactId,
} from '@registry/students/_server/actions';
import { unwrap } from '@/shared/lib/utils/actionResult';
import {
	createStudentContact,
	findStudentContact,
	findStudentEstimates,
	findStudentPayments,
	findStudentSalesReceipts,
	getFullContact,
	getInvoiceDetail,
	getSalesReceiptDetail,
	getStudentFinanceSummary,
	updateStudentContact,
} from './service';
import type {
	CreateStudentContactInput,
	ZohoContactComparison,
	ZohoContactComparisonField,
} from './types';

export async function resolveZohoContactId(
	stdNo: number,
	existingId: string | null | undefined
): Promise<string | null> {
	if (existingId) return existingId;

	const contact = await findStudentContact(stdNo);
	if (!contact) return null;

	unwrap(await saveZohoContactId(stdNo, contact.contact_id));
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

export async function getZohoContactUrl(contactId: string) {
	const orgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID;
	return `https://books.zoho.com/app/${orgId}#/contacts/${contactId}`;
}

export async function fetchInvoiceDetail(invoiceId: string) {
	return getInvoiceDetail(invoiceId);
}

export async function fetchSalesReceiptDetail(receiptId: string) {
	return getSalesReceiptDetail(receiptId);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeEmail(email: string | null | undefined): string | null {
	if (!email) return null;
	const trimmed = email.trim();
	if (!trimmed || !EMAIL_REGEX.test(trimmed)) return null;
	return trimmed;
}

async function buildContactInput(
	stdNo: number
): Promise<CreateStudentContactInput> {
	const student = unwrap(await getStudent(stdNo));
	if (!student) throw new Error(`Student ${stdNo} not found`);

	const name = student.name.trim();
	if (!name) throw new Error(`Student ${stdNo} has no name`);

	const activeProgram = student.programs.find((p) => p.status === 'Active');
	const program = activeProgram ?? student.programs[0];
	if (!program?.structure?.program)
		throw new Error(
			`Student ${stdNo} has no program assigned. Cannot create Zoho contact without a program.`
		);

	const structure = program.structure;
	const schoolId = structure.program.school?.id;

	const latestSemester = program.semesters?.at(-1);
	const sponsorId = latestSemester?.sponsorId;

	const [school, sponsor] = await Promise.all([
		schoolId ? getSchool(schoolId).then(unwrap) : null,
		sponsorId ? getSponsor(sponsorId) : null,
	]);

	return {
		stdNo,
		name,
		programName: structure.program.name ?? '',
		email: sanitizeEmail(student.user?.email),
		phone: student.phone1?.trim() || null,
		mobile: student.phone2?.trim() || null,
		schoolCode: school?.code ?? null,
		programCode: structure.program.code ?? null,
		sponsorCode: sponsor?.code ?? null,
		intakeDate: program.intakeDate ?? null,
	};
}

export async function createZohoContact(stdNo: number): Promise<string> {
	const input = await buildContactInput(stdNo);
	const contact = await createStudentContact(input);
	unwrap(await saveZohoContactId(stdNo, contact.contact_id));
	return contact.contact_id;
}

export async function fetchZohoContactComparison(
	stdNo: number,
	contactId: string
): Promise<ZohoContactComparison> {
	const [zohoContact, input] = await Promise.all([
		getFullContact(contactId),
		buildContactInput(stdNo),
	]);

	let dbNotes = input.programName;
	if (input.intakeDate) {
		dbNotes += ` Initial Intake Year ${input.intakeDate}`;
	}

	const tagNames = (zohoContact.tags ?? []).map((t) => t.tag_option_name);
	const dbTags: string[] = [];
	if (input.sponsorCode) {
		const map: Record<string, string> = { NMDS: 'ManPower', PRV: 'Private' };
		const tag = map[input.sponsorCode];
		if (tag) dbTags.push(tag);
	}
	if (input.schoolCode) {
		const aliases: Record<string, string> = {
			FICT: 'FINT',
			FBMG: 'FBS',
			FCM: 'FCO',
			FDI: 'FDSI',
		};
		dbTags.push(aliases[input.schoolCode] ?? input.schoolCode);
	}
	if (input.programCode) dbTags.push(input.programCode);

	const fields: ZohoContactComparisonField[] = [
		{
			label: 'Name',
			zohoValue: zohoContact.contact_name ?? '',
			dbValue: input.name,
			changed: (zohoContact.contact_name ?? '') !== input.name,
		},
		{
			label: 'Program',
			zohoValue: zohoContact.company_name ?? '',
			dbValue: input.programName,
			changed: (zohoContact.company_name ?? '') !== input.programName,
		},
		{
			label: 'Email',
			zohoValue: zohoContact.email ?? '',
			dbValue: input.email ?? '',
			changed: (zohoContact.email ?? '') !== (input.email ?? ''),
		},
		{
			label: 'Phone',
			zohoValue: zohoContact.phone ?? '',
			dbValue: input.phone ?? '',
			changed: (zohoContact.phone ?? '') !== (input.phone ?? ''),
		},
		{
			label: 'Notes',
			zohoValue: zohoContact.notes ?? '',
			dbValue: dbNotes,
			changed: (zohoContact.notes ?? '') !== dbNotes,
		},
		{
			label: 'Tags',
			zohoValue: tagNames.sort().join(', '),
			dbValue: dbTags.sort().join(', '),
			changed: tagNames.sort().join(',') !== dbTags.sort().join(','),
		},
	];

	return {
		contactId,
		fields,
		hasChanges: fields.some((f) => f.changed),
	};
}

export async function updateZohoContactFromDb(
	stdNo: number,
	contactId: string
): Promise<void> {
	const input = await buildContactInput(stdNo);
	await updateStudentContact(contactId, input);
}
