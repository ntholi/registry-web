'use server';

import type { subjects } from '@/core/database';
import { subjectsService } from './service';

type Subject = typeof subjects.$inferInsert;

export async function getSubject(id: number) {
	return subjectsService.get(id);
}

export async function findAllSubjects(page = 1, search = '') {
	return subjectsService.findAll({
		page,
		search,
		sort: [{ column: 'name', order: 'asc' }],
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

export async function updateSubject(id: number, data: Subject) {
	return subjectsService.update(id, data);
}

export async function deleteSubject(id: number) {
	return subjectsService.delete(id);
}

export async function toggleSubjectActive(id: number) {
	return subjectsService.toggleActive(id);
}

export async function addSubjectAlias(subjectId: number, alias: string) {
	return subjectsService.addAlias(subjectId, alias);
}

export async function removeSubjectAlias(aliasId: number) {
	return subjectsService.removeAlias(aliasId);
}

export async function getSubjectAliases(subjectId: number) {
	return subjectsService.getAliases(subjectId);
}
