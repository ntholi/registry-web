'use server';

import { getAllSchools } from '@academic/schools/_server/actions';
import { getUserSchools } from '@admin/users/_server/actions';
import { getAllTerms } from '@registry/terms/_server/actions';
import type { studentFeedbackCycles } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { studentFeedbackCyclesService as service } from './service';

type Cycle = typeof studentFeedbackCycles.$inferInsert;
type CycleWithSchools = Cycle & { schoolIds?: number[] };

export async function getCycles(page = 1, search = '') {
	return service.findAllWithSchoolCodes({
		page,
		search: search.trim(),
		searchColumns: ['name'],
	});
}

export async function getCycle(id: string) {
	return service.get(id);
}

export const createCycle = createAction(async (data: CycleWithSchools) => {
	const { schoolIds = [], ...cycleData } = data;
	return service.createWithSchools(cycleData, schoolIds);
});

export const updateCycle = createAction(
	async (id: string, data: CycleWithSchools) => {
		const { schoolIds = [], ...cycleData } = data;
		return service.updateWithSchools(id, cycleData, schoolIds);
	}
);

export const deleteCycle = createAction(async (id: string) =>
	service.delete(id)
);

export async function getClassesForCycle(cycleId: string, termId: number) {
	return service.getClassesForCycle(cycleId, termId);
}

export async function getPassphraseStats(cycleId: string) {
	return service.getPassphraseStats(cycleId);
}

export const generatePassphrases = createAction(
	async (
		cycleId: string,
		structureSemesterId: number,
		passphraseCount: number
	) =>
		service.generatePassphrases(cycleId, structureSemesterId, passphraseCount)
);

export async function getPassphrasesForClass(
	cycleId: string,
	structureSemesterId: number
) {
	return service.getPassphrasesForClass(cycleId, structureSemesterId);
}

export async function getTerms() {
	return getAllTerms();
}

export async function getSchools() {
	return getAllSchools();
}

export async function getSchoolsForUser(userId?: string) {
	return getUserSchools(userId);
}
