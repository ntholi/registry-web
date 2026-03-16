'use server';

import type { intakePeriods } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { intakePeriodsService } from './service';

type IntakePeriod = typeof intakePeriods.$inferInsert;

export async function getIntakePeriod(id: string) {
	return intakePeriodsService.get(id);
}

export async function getIntakePeriodWithPrograms(id: string) {
	return intakePeriodsService.findWithPrograms(id);
}

export async function findAllIntakePeriods(page = 1, search = '') {
	return intakePeriodsService.findAll({
		page,
		search,
		sort: [{ column: 'startDate', order: 'desc' }],
	});
}

export async function findActiveIntakePeriods() {
	return intakePeriodsService.findAllActive();
}

export async function findActiveIntakePeriod() {
	return intakePeriodsService.findActive();
}

export async function getIntakePeriodProgramIds(intakePeriodId: string) {
	return intakePeriodsService.getProgramIds(intakePeriodId);
}

export const setIntakePeriodProgramIds = createAction(
	async (intakePeriodId: string, programIds: number[]) =>
		intakePeriodsService.setProgramIds(intakePeriodId, programIds)
);

export async function getOpenProgramIds(intakePeriodId: string) {
	return intakePeriodsService.getOpenProgramIds(intakePeriodId);
}

export const createIntakePeriod = createAction(async (data: IntakePeriod) =>
	intakePeriodsService.create(data)
);

export const updateIntakePeriod = createAction(
	async (id: string, data: IntakePeriod) =>
		intakePeriodsService.update(id, data)
);

export const deleteIntakePeriod = createAction(async (id: string) =>
	intakePeriodsService.delete(id)
);
