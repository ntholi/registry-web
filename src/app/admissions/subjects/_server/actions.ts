'use server';

import { eq, isNull, type SQL } from 'drizzle-orm';
import { type subjects, subjects as subjectsTable } from '@/core/database';
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

export async function findOrCreateSubjectByName(name: string) {
	return subjectsService.findOrCreateByName(name);
}

export async function createSubject(data: Subject) {
	return subjectsService.create(data);
}

export async function updateSubject(id: string, data: Subject) {
	return subjectsService.update(id, data);
}

export async function deleteSubject(id: string) {
	return subjectsService.delete(id);
}

export async function toggleSubjectActive(id: string) {
	return subjectsService.toggleActive(id);
}

export async function addSubjectAlias(subjectId: string, alias: string) {
	return subjectsService.addAlias(subjectId, alias);
}

export async function removeSubjectAlias(aliasId: string) {
	return subjectsService.removeAlias(aliasId);
}

export async function getSubjectAliases(subjectId: string) {
	return subjectsService.getAliases(subjectId);
}

export async function moveSubjectToAlias(sourceId: string, targetId: string) {
	return subjectsService.moveToAlias(sourceId, targetId);
}
