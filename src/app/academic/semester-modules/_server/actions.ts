'use server';

import type { Grade } from '@registry/_database';
import type { semesterModules } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
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

export const createModule = createAction(
	async (module: Module & { prerequisiteCodes?: string[] }) => {
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
);

export const updateModule = createAction(
	async (id: number, module: Module & { prerequisiteCodes?: string[] }) => {
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
);

export const deleteModule = createAction(async (id: number) =>
	semesterModulesService.delete(id)
);

export async function getStructuresByModule(moduleId: number) {
	return semesterModulesService.getStructuresByModule(moduleId);
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

export const updateModuleVisibility = createAction(
	async (id: number, hidden: boolean) => {
		const existingModule = await semesterModulesService.get(id);
		if (!existingModule) {
			throw new Error('Module not found');
		}
		return semesterModulesService.update(id, { ...existingModule, hidden });
	}
);

export async function searchModulesWithDetails(search = '') {
	return semesterModulesService.searchModulesWithDetails(search);
}

export async function getStudentCountForModule(id: number) {
	return semesterModulesService.getStudentCountForModule(id);
}

export async function getModuleGradesByModuleId(moduleId: number) {
	return semesterModulesService.getGradesByModuleId(moduleId);
}

export const updateGradeByStudentModuleId = createAction(
	async (studentModuleId: number, grade: Grade, weightedTotal: number) =>
		semesterModulesService.updateGradeByStudentModuleId(
			studentModuleId,
			grade,
			weightedTotal
		)
);
