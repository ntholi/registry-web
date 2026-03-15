'use server';

import type { terms } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { termsService as service } from './service';

type Term = typeof terms.$inferInsert;

export const getTermByCode = createAction(async (code: string) => {
	return service.getByCode(code);
});

export const getActiveTerm = createAction(async () => {
	const term = await service.getActive();
	if (!term) {
		throw new Error('No active term');
	}
	return term;
});

export const findAllTerms = createAction(
	async (page: number = 1, search = '') => {
		return service.findAll({
			page,
			search,
			sort: [{ column: 'code', order: 'desc' }],
		});
	}
);

export const getAllTerms = createAction(async () => {
	return service.getAll();
});

export const createTerm = createAction(async (term: Term) => {
	return service.create(term);
});

export const updateTerm = createAction(async (id: number, term: Term) => {
	return service.update(id, term);
});

export const deleteTerm = createAction(async (id: number) => {
	return service.deleteTerm(id);
});
