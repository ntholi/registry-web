'use server';

import { getAllTerms } from '@registry/terms/_server/actions';
import type { feedbackCycles } from '@/core/database';
import { feedbackCyclesService as service } from './service';

type Cycle = typeof feedbackCycles.$inferInsert;

export async function getCycles(page = 1, search = '') {
	return service.findAll({
		page,
		search: search.trim(),
		searchColumns: ['name'],
	});
}

export async function getCycle(id: number) {
	return service.get(id);
}

export async function createCycle(data: Cycle) {
	return service.create(data);
}

export async function updateCycle(id: number, data: Cycle) {
	return service.update(id, data);
}

export async function deleteCycle(id: number) {
	return service.delete(id);
}

export async function getClassesForTerm(termId: number) {
	return service.getClassesForTerm(termId);
}

export async function getPassphraseStats(cycleId: number) {
	return service.getPassphraseStats(cycleId);
}

export async function generatePassphrases(
	cycleId: number,
	structureSemesterId: number,
	studentCount: number
) {
	return service.generatePassphrases(
		cycleId,
		structureSemesterId,
		studentCount
	);
}

export async function getPassphrasesForClass(
	cycleId: number,
	structureSemesterId: number
) {
	return service.getPassphrasesForClass(cycleId, structureSemesterId);
}

export async function getTerms() {
	return getAllTerms();
}
