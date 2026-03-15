'use server';

import type { terms } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { termsService as service } from './service';

type Term = typeof terms.$inferInsert;

export const getTermByCode = createAction(async (code: string) =>
	service.getByCode(code)
);

export const getActiveTerm = createAction(async () => {
	const term = await service.getActive();
	if (!term) {
		throw new Error('No active term');
	}
	return term;
});

export const findAllTerms = createAction(
	async (page: number = 1, search: string = '') =>
		service.findAll({
			page,
			search,
			sort: [{ column: 'code' as const, order: 'desc' }],
		})
);

export const getAllTerms = createAction(async () => service.getAll());

export const createTerm = createAction(async (term: Term) =>
	service.create(term)
);

export const updateTerm = createAction(async (id: number, term: Term) =>
	service.update(id, term)
);

export const deleteTerm = createAction(async (id: number) =>
	service.deleteTerm(id)
);
