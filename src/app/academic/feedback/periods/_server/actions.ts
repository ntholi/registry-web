'use server';

import { getAllTerms } from '@registry/terms/_server/actions';
import type { feedbackPeriods } from '@/core/database';
import { feedbackPeriodsService as service } from './service';

type Period = typeof feedbackPeriods.$inferInsert;

export async function getPeriods(page = 1, search = '') {
	return service.findAll({
		page,
		search: search.trim(),
		searchColumns: ['name'],
	});
}

export async function getPeriod(id: number) {
	return service.get(id);
}

export async function createPeriod(data: Period) {
	return service.create(data);
}

export async function updatePeriod(id: number, data: Period) {
	return service.update(id, data);
}

export async function deletePeriod(id: number) {
	return service.delete(id);
}

export async function getClassesForTerm(termId: number) {
	return service.getClassesForTerm(termId);
}

export async function getPassphraseStats(periodId: number) {
	return service.getPassphraseStats(periodId);
}

export async function generatePassphrases(
	periodId: number,
	structureSemesterId: number,
	studentCount: number
) {
	return service.generatePassphrases(
		periodId,
		structureSemesterId,
		studentCount
	);
}

export async function getPassphrasesForClass(
	periodId: number,
	structureSemesterId: number
) {
	return service.getPassphrasesForClass(periodId, structureSemesterId);
}

export async function getTerms() {
	return getAllTerms();
}
