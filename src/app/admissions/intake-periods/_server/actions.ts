'use server';

import type { intakePeriods } from '@/core/database';
import { intakePeriodsService } from './service';

type IntakePeriod = typeof intakePeriods.$inferInsert;

export async function getIntakePeriod(id: number) {
	return intakePeriodsService.get(id);
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

export async function createIntakePeriod(data: IntakePeriod) {
	return intakePeriodsService.create(data);
}

export async function updateIntakePeriod(id: number, data: IntakePeriod) {
	return intakePeriodsService.update(id, data);
}

export async function deleteIntakePeriod(id: number) {
	return intakePeriodsService.delete(id);
}
