'use server';

import { bulkService as service } from './service';

export async function getDistinctGraduationDates() {
	return service.getDistinctGraduationDates();
}

export async function getProgramsByGraduationDate(graduationDate: string) {
	return service.getProgramsByGraduationDate(graduationDate);
}

export async function getStudentsByGraduationDate(
	graduationDate: string,
	programIds?: number[]
) {
	return service.getStudentsByGraduationDate(graduationDate, programIds);
}
