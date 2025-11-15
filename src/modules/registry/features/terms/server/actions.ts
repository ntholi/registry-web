'use server';

import type { terms } from '@/core/database';
import { termsService as service } from './service';

type Term = typeof terms.$inferInsert;

export async function getTerm(id: number) {
	return service.get(id);
}

export async function getCurrentTerm() {
	const term = await service.getActive();
	if (!term) {
		throw new Error('No active term');
	}
	return term;
}

export async function findAllTerms(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		sort: [{ column: 'name', order: 'desc' }],
	});
}

export async function getAllTerms() {
	return service.getAll();
}

export async function createTerm(term: Term) {
	return service.create(term);
}

export async function updateTerm(id: number, term: Term) {
	return service.update(id, term);
}

export async function deleteTerm(id: number) {
	return service.deleteTerm(id);
}
