'use server';

import { eq, isNull, type SQL } from 'drizzle-orm';
import { type subjects, subjects as subjectsTable } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { subjectsService } from './service';

type Subject = typeof subjects.$inferInsert;

export async function getSubject(id: string) {
	return subjectsService.get(id);
}

export async function findAllSubjects(
	page = 1,
	search = '',
	lqfLevel?: number | null
) {
	let filter: SQL | undefined;
	if (lqfLevel !== undefined) {
		filter =
			lqfLevel === null
				? isNull(subjectsTable.lqfLevel)
				: eq(subjectsTable.lqfLevel, lqfLevel);
	}
	return subjectsService.findAll({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'name', order: 'asc' }],
		filter,
	});
}

export async function findActiveSubjects() {
	return subjectsService.findActive();
}

export const findOrCreateSubjectByName = createAction(async (name: string) =>
	subjectsService.findOrCreateByName(name)
);

export const createSubject = createAction(async (data: Subject) =>
	subjectsService.create(data)
);

export const updateSubject = createAction(async (id: string, data: Subject) =>
	subjectsService.update(id, data)
);

export const deleteSubject = createAction(async (id: string) =>
	subjectsService.delete(id)
);

export const toggleSubjectActive = createAction(async (id: string) =>
	subjectsService.toggleActive(id)
);

export const addSubjectAlias = createAction(
	async (subjectId: string, alias: string) =>
		subjectsService.addAlias(subjectId, alias)
);

export const removeSubjectAlias = createAction(async (aliasId: string) =>
	subjectsService.removeAlias(aliasId)
);

export async function getSubjectAliases(subjectId: string) {
	return subjectsService.getAliases(subjectId);
}

export const moveSubjectToAlias = createAction(
	async (sourceId: string, targetId: string) =>
		subjectsService.moveToAlias(sourceId, targetId)
);
