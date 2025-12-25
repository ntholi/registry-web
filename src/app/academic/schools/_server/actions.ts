'use server';

import { eq } from 'drizzle-orm';
import { schools } from '@/core/database';
import { schoolsService as service } from './service';

export async function findAllSchools() {
	return service.findAll();
}

export async function getAllSchools() {
	const data = await service.findAll({ filter: eq(schools.isActive, true) });
	return data.items;
}

export async function getActiveSchools() {
	return service.getActiveSchools();
}

export async function getSchool(id: number) {
	return service.get(id);
}

export async function getProgramsBySchoolId(schoolId?: number) {
	return service.getProgramsBySchoolId(schoolId);
}

export async function getAllPrograms() {
	return service.getAllPrograms();
}

export async function getProgramsBySchoolIds(schoolIds?: number[]) {
	return service.getProgramsBySchoolIds(schoolIds);
}
