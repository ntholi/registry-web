'use server';

import { structuresService as service } from './service';

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
