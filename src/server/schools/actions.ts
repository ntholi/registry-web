'use server';

import { eq } from 'drizzle-orm';
import { schoolsService as service } from './service';
import { schools } from '@/db/schema';

export async function findAllSchools() {
  return service.findAll();
}

export async function getAllSchools() {
  return service.findAll({ filter: eq(schools.isActive, true) });
}

export async function getSchool(id: number) {
  return service.get(id);
}
