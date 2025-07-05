'use server';

import { schoolsService as service } from './service';

export async function findAllSchools() {
  return service.findAll();
}

export async function getAllSchools() {
  return service.getAll();
}

export async function getSchool(id: number) {
  return service.get(id);
}
