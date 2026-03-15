'use server';

import { eq, isNull, type SQL } from 'drizzle-orm';
import { type subjects, subjects as subjectsTable } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { subjectsService } from './service';

type Subject = typeof subjects.$inferInsert;

export const getSubject = createAction(async (id: string) => {
	return subjectsService.get(id);
});

export const findAllSubjects = createAction(
	async (page: number = 1, search: string = '', lqfLevel?: number | null) => {
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
);

export const findActiveSubjects = createAction(async () => {
	return subjectsService.findActive();
});

export const findOrCreateSubjectByName = createAction(async (name: string) => {
	return subjectsService.findOrCreateByName(name);
});

export const createSubject = createAction(async (data: Subject) => {
	return subjectsService.create(data);
});

export const updateSubject = createAction(async (id: string, data: Subject) => {
	return subjectsService.update(id, data);
});

export const deleteSubject = createAction(async (id: string) => {
	return subjectsService.delete(id);
});

export const toggleSubjectActive = createAction(async (id: string) => {
	return subjectsService.toggleActive(id);
});

export const addSubjectAlias = createAction(
	async (subjectId: string, alias: string) => {
		return subjectsService.addAlias(subjectId, alias);
	}
);

export const removeSubjectAlias = createAction(async (aliasId: string) => {
	return subjectsService.removeAlias(aliasId);
});

export const getSubjectAliases = createAction(async (subjectId: string) => {
	return subjectsService.getAliases(subjectId);
});

export const moveSubjectToAlias = createAction(
	async (sourceId: string, targetId: string) => {
		return subjectsService.moveToAlias(sourceId, targetId);
	}
);
