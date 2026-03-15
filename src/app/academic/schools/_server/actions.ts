'use server';

import { eq } from 'drizzle-orm';
import { schools } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { schoolsService as service } from './service';

export const getAllSchools = createAction(async () => {
	const data = await service.findAll({ filter: eq(schools.isActive, true) });
	return data.items;
});

export const getActiveSchools = createAction(async () =>
	service.getActiveSchools()
);

export const getSchool = createAction(async (id: number) => service.get(id));

export const getProgramsBySchoolId = createAction(async (schoolId?: number) =>
	service.getProgramsBySchoolId(schoolId)
);

export const getAllPrograms = createAction(async () =>
	service.getAllPrograms()
);

export const getAllProgramsWithLevel = createAction(async () =>
	service.getAllProgramsWithLevel()
);

export const getProgramsBySchoolIds = createAction(
	async (schoolIds?: number[]) => service.getProgramsBySchoolIds(schoolIds)
);
