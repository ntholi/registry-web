'use server';

import { termRegistrationsService as service } from './termRegistrationsService';

export interface RegistrationEntry {
	schoolId: number;
	startDate: string;
	endDate: string;
	programIds?: number[];
}

export async function getTermRegistrations(termId: number) {
	return service.findByTermId(termId);
}

export async function createTermRegistration(
	termId: number,
	schoolId: number,
	startDate: string,
	endDate: string,
	programIds?: number[]
) {
	return service.create(termId, schoolId, startDate, endDate, programIds);
}

export async function updateTermRegistration(
	id: number,
	startDate: string,
	endDate: string,
	programIds?: number[]
) {
	return service.update(id, startDate, endDate, programIds);
}

export async function deleteTermRegistration(id: number) {
	return service.delete(id);
}

export async function saveTermRegistrations(
	termId: number,
	entries: RegistrationEntry[]
) {
	return service.saveRegistrations(termId, entries);
}

export async function deleteTermRegistrationsBySchoolIds(
	termId: number,
	schoolIds: number[]
) {
	return service.deleteBySchoolIds(termId, schoolIds);
}

export async function canStudentRegister(
	termId: number,
	schoolId: number,
	programId: number
) {
	return service.canStudentRegister(termId, schoolId, programId);
}

export async function getRegistrationStatus(termId: number, schoolId: number) {
	return service.getRegistrationStatus(termId, schoolId);
}
