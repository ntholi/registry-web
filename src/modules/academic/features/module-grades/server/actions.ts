'use server';

import type { ModuleGradeInsert } from './repository';
import { moduleGradesService as service } from './service';

export async function findModuleGradeByModuleAndStudent(
	moduleId: number,
	stdNo: number
) {
	return service.findByModuleAndStudent(moduleId, stdNo);
}

export async function getModuleGradesByModuleId(moduleId: number) {
	return service.getByModuleId(moduleId);
}

export async function upsertModuleGrade(moduleGrade: ModuleGradeInsert) {
	return service.upsertModuleGrade(moduleGrade);
}
