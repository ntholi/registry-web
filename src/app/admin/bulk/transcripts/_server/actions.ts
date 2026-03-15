'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import { bulkService as service } from './service';

export const getDistinctGraduationDates = createAction(async () => {
	return service.getDistinctGraduationDates();
});

export const getProgramsByGraduationDate = createAction(
	async (graduationDate: string) => {
		return service.getProgramsByGraduationDate(graduationDate);
	}
);

export const getStudentsByGraduationDate = createAction(
	async (graduationDate: string, programIds?: number[]) => {
		return service.getStudentsByGraduationDate(graduationDate, programIds);
	}
);
