'use server';

import { eq } from 'drizzle-orm';
import { schools } from '@/db/schema';
import { schoolsService as service } from './service';

export async function findAllSchools() {
	return service.findAll();
}

export async function getAllSchools() {
	return service.findAll({ filter: eq(schools.isActive, true) });
}

export async function getSchool(id: number) {
	return service.get(id);
}

export async function getProgramsBySchoolId(schoolId: number) {
	return service.getProgramsBySchoolId(schoolId);
}

export async function getAllPrograms() {
	return service.getAllPrograms();
}
