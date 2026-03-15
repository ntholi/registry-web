'use server';

import type { structureSemesters } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { structuresService as service } from './service';

type StructureSemester = typeof structureSemesters.$inferInsert;

export const getStructure = createAction(async (id: number) => service.get(id));

export const getStructuresByProgramId = createAction(
	async (programId: number) => service.getByProgramId(programId)
);

export const getStructureModules = createAction(async (structureId: number) =>
	service.getStructureModules(structureId)
);

export const getStructureSemestersByStructureId = createAction(
	async (structureId: number) =>
		service.getStructureSemestersByStructureId(structureId)
);

export const createStructureSemester = createAction(
	async (data: StructureSemester) => service.createStructureSemester(data)
);
