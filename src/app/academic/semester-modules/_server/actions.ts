'use server';

import type { Grade } from '@registry/_database';
import type { semesterModules } from '@/core/database';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import { semesterModulesService } from './service';

type Module = typeof semesterModules.$inferInsert;

export const getSemesterModule = createAction(async (id: number) =>
	semesterModulesService.get(id)
);

export const findAllModules = createAction(
	async (page: number = 1, search: string = '') =>
		semesterModulesService.search(
			{
				page,
			},
			search
		)
);

export const findModulesByStructure = createAction(
	async (structureId: number, search: string = '') =>
		semesterModulesService.findModulesByStructure(structureId, search)
);

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

export const getStructuresByModule = createAction(async (moduleId: number) =>
	semesterModulesService.getStructuresByModule(moduleId)
);

export const getModulePrerequisites = createAction(async (moduleId: number) =>
	semesterModulesService.getPrerequisites(moduleId)
);

export const getModulesForStructure = createAction(
	async (structureId: number) =>
		semesterModulesService.getModulesForStructure(structureId)
);

export const getVisibleModulesForStructure = createAction(
	async (structureId: number) => {
		const data = unwrap(await getModulesForStructure(structureId));
		return data.map((semester) => ({
			...semester,
			semesterModules: semester.semesterModules.filter((sm) => !sm.hidden),
		}));
	}
);

export const updateModuleVisibility = createAction(
	async (id: number, hidden: boolean) => {
		const existingModule = await semesterModulesService.get(id);
		if (!existingModule) {
			throw new Error('Module not found');
		}
		return semesterModulesService.update(id, { ...existingModule, hidden });
	}
);

export const searchModulesWithDetails = createAction(
	async (search: string = '') =>
		semesterModulesService.searchModulesWithDetails(search)
);

export const getStudentCountForModule = createAction(async (id: number) =>
	semesterModulesService.getStudentCountForModule(id)
);

export const getModuleGradesByModuleId = createAction(
	async (moduleId: number) =>
		semesterModulesService.getGradesByModuleId(moduleId)
);

export const updateGradeByStudentModuleId = createAction(
	async (studentModuleId: number, grade: Grade, weightedTotal: number) =>
		semesterModulesService.updateGradeByStudentModuleId(
			studentModuleId,
			grade,
			weightedTotal
		)
);
