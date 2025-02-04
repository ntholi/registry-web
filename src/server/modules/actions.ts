'use server';


import { modules } from '@/db/schema';
import { modulesService as service} from './service';

type Module = typeof modules.$inferInsert;


export async function getModule(id: number) {
  return service.get(id);
}

export async function findAllModules(page: number = 1, search = '') {
  return service.findAll({ page, search });
}

export async function createModule(module: Module) {
  return service.create(module);
}

export async function updateModule(id: number, module: Module) {
  return service.update(id, module);
}

export async function deleteModule(id: number) {
  return service.delete(id);
}