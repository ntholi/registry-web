'use server';

import type { intakePeriods } from '@/core/database';
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

export async function setIntakePeriodProgramIds(
	intakePeriodId: string,
	programIds: number[]
) {
	return intakePeriodsService.setProgramIds(intakePeriodId, programIds);
}

export async function getOpenProgramIds(intakePeriodId: string) {
	return intakePeriodsService.getOpenProgramIds(intakePeriodId);
}

export async function createIntakePeriod(data: IntakePeriod) {
	return intakePeriodsService.create(data);
}

export async function updateIntakePeriod(id: string, data: IntakePeriod) {
	return intakePeriodsService.update(id, data);
}

export async function deleteIntakePeriod(id: string) {
	return intakePeriodsService.delete(id);
}
