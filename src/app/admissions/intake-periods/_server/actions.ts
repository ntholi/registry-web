'use server';

import type { intakePeriods } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { intakePeriodsService } from './service';

type IntakePeriod = typeof intakePeriods.$inferInsert;

export const getIntakePeriod = createAction(async (id: string) => {
	return intakePeriodsService.get(id);
});

export const getIntakePeriodWithPrograms = createAction(async (id: string) => {
	return intakePeriodsService.findWithPrograms(id);
});

export const findAllIntakePeriods = createAction(
	async (page: number = 1, search: string = '') => {
		return intakePeriodsService.findAll({
			page,
			search,
			sort: [{ column: 'startDate', order: 'desc' }],
		});
	}
);

export const findActiveIntakePeriods = createAction(async () => {
	return intakePeriodsService.findAllActive();
});

export const findActiveIntakePeriod = createAction(async () => {
	return intakePeriodsService.findActive();
});

export const getIntakePeriodProgramIds = createAction(
	async (intakePeriodId: string) => {
		return intakePeriodsService.getProgramIds(intakePeriodId);
	}
);

export const setIntakePeriodProgramIds = createAction(
	async (intakePeriodId: string, programIds: number[]) => {
		return intakePeriodsService.setProgramIds(intakePeriodId, programIds);
	}
);

export const getOpenProgramIds = createAction(
	async (intakePeriodId: string) => {
		return intakePeriodsService.getOpenProgramIds(intakePeriodId);
	}
);

export const createIntakePeriod = createAction(async (data: IntakePeriod) => {
	return intakePeriodsService.create(data);
});

export const updateIntakePeriod = createAction(
	async (id: string, data: IntakePeriod) => {
		return intakePeriodsService.update(id, data);
	}
);

export const deleteIntakePeriod = createAction(async (id: string) => {
	return intakePeriodsService.delete(id);
});
