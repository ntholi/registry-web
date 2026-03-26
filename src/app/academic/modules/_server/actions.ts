'use server';

import { and, eq, inArray, type SQL } from 'drizzle-orm';
import {
	db,
	modules,
	programs,
	semesterModules,
	structureSemesters,
	structures,
} from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { modulesService as service } from './service';

type Module = typeof modules.$inferInsert;

export async function getModule(id: number) {
	return service.get(id);
}

export async function getModules(
	page: number = 1,
	search = '',
	schoolId?: string,
	status?: string
) {
	const conditions: SQL[] = [];
	if (schoolId)
		conditions.push(
			inArray(
				modules.id,
				db
					.select({ id: semesterModules.moduleId })
					.from(semesterModules)
					.innerJoin(
						structureSemesters,
						eq(semesterModules.semesterId, structureSemesters.id)
					)
					.innerJoin(
						structures,
						eq(structureSemesters.structureId, structures.id)
					)
					.innerJoin(programs, eq(structures.programId, programs.id))
					.where(eq(programs.schoolId, Number(schoolId)))
			)
		);
	if (status)
		conditions.push(
			eq(modules.status, status as typeof modules.$inferSelect.status)
		);

	return service.findAll({
		page,
		search: search.trim(),
		searchColumns: ['code', 'name'],
		filter: conditions.length ? and(...conditions) : undefined,
	});
}

export const createModule = createAction(async (module: Module) =>
	service.create(module)
);

export const updateModule = createAction(async (id: number, module: Module) =>
	service.update(id, module)
);
