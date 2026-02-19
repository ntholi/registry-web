'use server';

import { getAllSchools } from '@academic/schools/_server/actions';
import { getUserSchools } from '@admin/users/_server/actions';
import { getAllTerms } from '@registry/terms/_server/actions';
import type { feedbackCycles } from '@/core/database';
import { feedbackCyclesService as service } from './service';

type Cycle = typeof feedbackCycles.$inferInsert;
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

export async function createCycle(data: CycleWithSchools) {
	const { schoolIds = [], ...cycleData } = data;
	return service.createWithSchools(cycleData, schoolIds);
}

export async function updateCycle(id: string, data: CycleWithSchools) {
	const { schoolIds = [], ...cycleData } = data;
	return service.updateWithSchools(id, cycleData, schoolIds);
}

export async function deleteCycle(id: string) {
	return service.delete(id);
}

export async function getClassesForCycle(cycleId: string, termId: number) {
	return service.getClassesForCycle(cycleId, termId);
}

export async function getPassphraseStats(cycleId: string) {
	return service.getPassphraseStats(cycleId);
}

export async function generatePassphrases(
	cycleId: string,
	structureSemesterId: number,
	passphraseCount: number
) {
	return service.generatePassphrases(
		cycleId,
		structureSemesterId,
		passphraseCount
	);
}

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
