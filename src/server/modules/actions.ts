'use server';

import { modules } from '@/db/schema';
import { modulesService } from './service';

type Module = typeof modules.$inferInsert;

export async function getModule(id: number) {
  return modulesService.get(id);
}

export async function findAllModules(page: number = 1, search = '') {
  return modulesService.findAll({
    page,
    search,
    searchColumns: ['id', 'code', 'name'],
  });
}

export async function findModulesByStructure(structureId: number, search = '') {
  return modulesService.findModulesByStructure(structureId, search);
}

export async function createModule(
  module: Module & { prerequisiteCodes?: string[] },
) {
  const { prerequisiteCodes, ...moduleData } = module;
  const newModule = await modulesService.create(moduleData);

  if (prerequisiteCodes && prerequisiteCodes.length > 0) {
    await Promise.all(
      prerequisiteCodes.map(async (code) => {
        const mod = await modulesService.getByCode(code);
        if (mod) {
          await modulesService.addPrerequisite(newModule.id, mod.id);
        }
      }),
    );
  }

  return newModule;
}

export async function updateModule(
  id: number,
  module: Module & { prerequisiteCodes?: string[] },
) {
  const { prerequisiteCodes, ...moduleData } = module;
  const updatedModule = await modulesService.update(id, moduleData);

  await modulesService.clearPrerequisites(id);

  if (prerequisiteCodes && prerequisiteCodes.length > 0) {
    await Promise.all(
      prerequisiteCodes.map(async (code) => {
        const mod = await modulesService.getByCode(code);
        if (mod) {
          await modulesService.addPrerequisite(id, mod.id);
        }
      }),
    );
  }

  return updatedModule;
}

export async function deleteModule(id: number) {
  return modulesService.delete(id);
}

export async function getModulesByStructure(structureId: number) {
  return await modulesService.getModulesByStructure(structureId);
}

export async function getSchools() {
  return await modulesService.getSchools();
}

export async function getProgramsBySchool(schoolId: number) {
  return await modulesService.getProgramsBySchool(schoolId);
}

export async function getStructuresByProgram(programId: number) {
  return await modulesService.getStructuresByProgram(programId);
}

export async function getModulePrerequisites(moduleId: number) {
  return modulesService.getPrerequisites(moduleId);
}

export async function getModulesForStructure(structureId: number) {
  return modulesService.getModulesForStructure(structureId);
}

export async function updateModuleVisibility(id: number, hidden: boolean) {
  const existingModule = await modulesService.get(id);
  if (!existingModule) {
    throw new Error('Module not found');
  }
  return modulesService.update(id, { ...existingModule, hidden });
}

export async function searchModulesWithDetails(search = '') {
  return modulesService.searchModulesWithDetails(search);
}
