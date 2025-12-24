'use server';

import type { Grade } from '@academic/_database';
import type { semesterModules } from '@/core/database';
import type { ModuleGradeInsert } from './repository';
import { semesterModulesService } from './service';

type Module = typeof semesterModules.$inferInsert;

export async function getSemesterModule(id: number) {
	return semesterModulesService.get(id);
}

export async function findAllModules(page: number = 1, search = '') {
	return semesterModulesService.search(
		{
			page,
		},
		search
	);
}

export async function findModulesByStructure(structureId: number, search = '') {
	return semesterModulesService.findModulesByStructure(structureId, search);
}

export async function createModule(
	module: Module & { prerequisiteCodes?: string[] }
) {
	const { prerequisiteCodes, ...moduleData } = module;
	const newModule = await semesterModulesService.create(moduleData);

	if (prerequisiteCodes && prerequisiteCodes.length > 0) {
		await Promise.all(
			prerequisiteCodes.map(async (code) => {
				const mod = await semesterModulesService.getByCode(code);
				if (mod) {
					await semesterModulesService.addPrerequisite(newModule.id, mod.id);
				}
			})
		);
	}

	return newModule;
}

export async function updateModule(
	id: number,
	module: Module & { prerequisiteCodes?: string[] }
) {
	const { prerequisiteCodes, ...moduleData } = module;
	const updatedModule = await semesterModulesService.update(id, moduleData);

	await semesterModulesService.clearPrerequisites(id);

	if (prerequisiteCodes && prerequisiteCodes.length > 0) {
		await Promise.all(
			prerequisiteCodes.map(async (code) => {
				const mod = await semesterModulesService.getByCode(code);
				if (mod) {
					await semesterModulesService.addPrerequisite(id, mod.id);
				}
			})
		);
	}

	return updatedModule;
}

export async function deleteModule(id: number) {
	return semesterModulesService.delete(id);
}

export async function getModulesByStructure(structureId: number) {
	return await semesterModulesService.getModulesByStructure(structureId);
}

export async function getStructuresByModule(moduleId: number) {
	return await semesterModulesService.getStructuresByModule(moduleId);
}

export async function getModulePrerequisites(moduleId: number) {
	return semesterModulesService.getPrerequisites(moduleId);
}

export async function getModulesForStructure(structureId: number) {
	return semesterModulesService.getModulesForStructure(structureId);
}

export async function getVisibleModulesForStructure(structureId: number) {
	const data = await getModulesForStructure(structureId);
	return data.map((semester) => ({
		...semester,
		semesterModules: semester.semesterModules.filter((sm) => !sm.hidden),
	}));
}

export async function updateModuleVisibility(id: number, hidden: boolean) {
	const existingModule = await semesterModulesService.get(id);
	if (!existingModule) {
		throw new Error('Module not found');
	}
	return semesterModulesService.update(id, { ...existingModule, hidden });
}

export async function searchModulesWithDetails(search = '') {
	return semesterModulesService.searchModulesWithDetails(search);
}
export async function getStudentCountForModule(id: number) {
	return semesterModulesService.getStudentCountForModule(id);
}

export async function findModuleGradeByModuleAndStudent(
	moduleId: number,
	stdNo: number
) {
	return semesterModulesService.findGradeByModuleAndStudent(moduleId, stdNo);
}

export async function getModuleGradesByModuleId(moduleId: number) {
	return semesterModulesService.getGradesByModuleId(moduleId);
}

export async function upsertModuleGrade(moduleGrade: ModuleGradeInsert) {
	return semesterModulesService.upsertModuleGrade(moduleGrade);
}

export async function updateGradeByStudentModuleId(
	studentModuleId: number,
	grade: Grade,
	weightedTotal: number
) {
	return semesterModulesService.updateGradeByStudentModuleId(
		studentModuleId,
		grade,
		weightedTotal
	);
}

export async function deleteSemesterModule(id: number) {
	return semesterModulesService.deleteSemesterModule(id);
}
