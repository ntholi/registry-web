'use server';

import type { structureSemesters } from '@/core/database';
import { structuresService as service } from './service';

type StructureSemester = typeof structureSemesters.$inferInsert;

export async function getStructure(id: number) {
	return service.get(id);
}

export async function getStructuresByProgramId(programId: number) {
	return service.getByProgramId(programId);
}

export async function getStructureModules(structureId: number) {
	return service.getStructureModules(structureId);
}

export async function getStructureSemestersByStructureId(structureId: number) {
	return service.getStructureSemestersByStructureId(structureId);
}

export async function createStructureSemester(data: StructureSemester) {
	return service.createStructureSemester(data);
}
