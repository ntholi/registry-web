'use server';

import type { applicants, guardians } from '@/core/database';
import { applicantsService } from './service';

type Applicant = typeof applicants.$inferInsert;
type Guardian = typeof guardians.$inferInsert;

export async function getApplicant(id: string) {
	return applicantsService.get(id);
}

export async function findAllApplicants(page = 1, search = '') {
	return applicantsService.search(page, search);
}

export async function createApplicant(data: Applicant) {
	return applicantsService.create(data);
}

export async function updateApplicant(id: string, data: Applicant) {
	return applicantsService.update(id, data);
}

export async function deleteApplicant(id: string) {
	return applicantsService.delete(id);
}

export async function addApplicantPhone(
	applicantId: string,
	phoneNumber: string
) {
	return applicantsService.addPhone(applicantId, phoneNumber);
}

export async function removeApplicantPhone(phoneId: number) {
	return applicantsService.removePhone(phoneId);
}

export async function createGuardian(data: Guardian) {
	return applicantsService.createGuardian(data);
}

export async function updateGuardian(id: number, data: Partial<Guardian>) {
	return applicantsService.updateGuardian(id, data);
}

export async function deleteGuardian(id: number) {
	return applicantsService.deleteGuardian(id);
}

export async function addGuardianPhone(
	guardianId: number,
	phoneNumber: string
) {
	return applicantsService.addGuardianPhone(guardianId, phoneNumber);
}

export async function removeGuardianPhone(phoneId: number) {
	return applicantsService.removeGuardianPhone(phoneId);
}
