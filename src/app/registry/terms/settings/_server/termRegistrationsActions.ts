'use server';

import { createAction } from '@/shared/lib/actions/actionResult';
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

export const createTermRegistration = createAction(
	async (
		termId: number,
		schoolId: number,
		startDate: string,
		endDate: string,
		programIds?: number[]
	) => {
		return service.create(termId, schoolId, startDate, endDate, programIds);
	}
);

export const updateTermRegistration = createAction(
	async (
		id: number,
		startDate: string,
		endDate: string,
		programIds?: number[]
	) => {
		return service.update(id, startDate, endDate, programIds);
	}
);

export const deleteTermRegistration = createAction(async (id: number) => {
	return service.delete(id);
});

export const saveTermRegistrations = createAction(
	async (termId: number, entries: RegistrationEntry[]) => {
		return service.saveRegistrations(termId, entries);
	}
);

export const deleteTermRegistrationsBySchoolIds = createAction(
	async (termId: number, schoolIds: number[]) => {
		return service.deleteBySchoolIds(termId, schoolIds);
	}
);

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
