'use server';

import type { moduleGrades } from '@/core/database';
import { moduleGradesService as service } from './service';

type ModuleGrade = typeof moduleGrades.$inferInsert;

export async function getModuleGrade(id: number) {
	return service.get(id);
}

export async function getModuleGrades(page: number = 1, search = '') {
	return service.findAll({ page, search });
}

export async function createModuleGrade(moduleGrade: ModuleGrade) {
	return service.create(moduleGrade);
}

export async function updateModuleGrade(id: number, moduleGrade: ModuleGrade) {
	return service.update(id, moduleGrade);
}

export async function deleteModuleGrade(id: number) {
	return service.delete(id);
}

export async function findModuleGradeByModuleAndStudent(
	moduleId: number,
	stdNo: number
) {
	return service.findByModuleAndStudent(moduleId, stdNo);
}

export async function getModuleGradesByModuleId(moduleId: number) {
	return service.getByModuleId(moduleId);
}

export async function upsertModuleGrade(moduleGrade: ModuleGrade) {
	return service.upsertModuleGrade(moduleGrade);
}
