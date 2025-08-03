'use server';

import { structures } from '@/db/schema';
import { structuresService as service } from './service';

type Structure = typeof structures.$inferInsert;

export async function getStructure(id: number) {
  return service.get(id);
}

export async function deleteSemesterModule(id: number) {
  await service.deleteSemesterModule(id);
}

export async function findAllStructures(page: number = 1, search = '') {
  return service.findAll({ page, search });
}

export async function createStructure(structure: Structure) {
  return service.create(structure);
}

export async function updateStructure(id: number, structure: Structure) {
  return service.update(id, structure);
}

export async function deleteStructure(id: number) {
  return service.delete(id);
}

export async function getStructuresByProgramId(programId: number) {
  return service.getByProgramId(programId);
}

export async function getStructureModules(structureId: number) {
  return service.getStructureModules(structureId);
}
