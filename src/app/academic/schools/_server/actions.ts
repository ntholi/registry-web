'use server';

import { eq } from 'drizzle-orm';
import { schools } from '@/core/database';
import { schoolsService as service } from './service';

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

export async function getAllProgramsWithLevel() {
	return service.getAllProgramsWithLevel();
}

export async function getProgramsBySchoolIds(schoolIds?: number[]) {
	return service.getProgramsBySchoolIds(schoolIds);
}

export async function findAllSchools(page: number, search: string) {
	return service.findAll({
		page,
		search,
		searchColumns: ['name', 'code'],
		filter: eq(schools.isActive, true),
	});
}

export async function searchPrograms(search: string, limit: number) {
	return service.searchPrograms(search, limit);
}
