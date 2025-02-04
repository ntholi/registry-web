'use server';

import { modules } from '@/db/schema';
import { modulesService } from './service';

type Module = typeof modules.$inferInsert;

export async function getModule(id: number) {
  return modulesService.get(id);
}

export async function findAllModules(page: number = 1, search = '') {
  return modulesService.findAll({ page, search });
}

export async function createModule(module: Module) {
  return modulesService.create(module);
}

export async function updateModule(id: number, module: Module) {
  return modulesService.update(id, module);
}

export async function deleteModule(id: number) {
  return modulesService.delete(id);
}

export async function getModulesByStructure(structureId: number) {
  const modules = await modulesService.getModulesByStructure(structureId);
  return modules;
}

export async function getSchools() {
  const schools = await modulesService.getSchools();
  return schools;
}

export async function getProgramsBySchool(schoolId: number) {
  const programs = await modulesService.getProgramsBySchool(schoolId);
  return programs;
}

export async function getStructuresByProgram(programId: number) {
  const structures = await modulesService.getStructuresByProgram(programId);
  return structures;
}
