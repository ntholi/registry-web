'use server';

import type { terms } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { termsService as service } from './service';

type Term = typeof terms.$inferInsert;

export async function getTermByCode(code: string) {
	return service.getByCode(code);
}

export async function getActiveTerm() {
	return service.getActiveOrThrow();
}

export async function findAllTerms(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		sort: [{ column: 'code', order: 'desc' }],
	});
}

export async function getAllTerms() {
	return service.getAll();
}

export const createTerm = createAction(async (term: Term) => {
	return service.create(term);
});

export const updateTerm = createAction(async (id: number, term: Term) => {
	return service.update(id, term);
});

export const deleteTerm = createAction(async (id: number) => {
	return service.deleteTerm(id);
});
