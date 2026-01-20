'use server';

import {
	addApplicantPhone,
	addGuardianPhone,
	createGuardian,
	deleteGuardian,
	removeApplicantPhone,
	removeGuardianPhone,
	updateApplicant,
	updateGuardian,
} from '@admissions/applicants';
import type { applicants, guardians } from '@/core/database';

type ApplicantInput = typeof applicants.$inferInsert;
type GuardianInput = typeof guardians.$inferInsert;

export async function updateApplicantInfo(id: string, data: ApplicantInput) {
	return updateApplicant(id, data);
}

export async function addPhone(applicantId: string, phoneNumber: string) {
	return addApplicantPhone(applicantId, phoneNumber);
}

export async function removePhone(phoneId: string) {
	return removeApplicantPhone(phoneId);
}

export async function addNewGuardian(
	data: GuardianInput,
	phoneNumber?: string
) {
	return createGuardian(data, phoneNumber);
}

export async function updateExistingGuardian(
	id: string,
	data: Partial<GuardianInput>
) {
	return updateGuardian(id, data);
}

export async function removeGuardian(id: string) {
	return deleteGuardian(id);
}

export async function addGuardianPhoneNumber(
	guardianId: string,
	phoneNumber: string
) {
	return addGuardianPhone(guardianId, phoneNumber);
}

export async function removeGuardianPhoneNumber(phoneId: string) {
	return removeGuardianPhone(phoneId);
}
