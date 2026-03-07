'use server';

import type { employees } from '@/core/database';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { formatPersonName } from '@/shared/lib/utils/names';
import { employeesService as service } from './service';

type Employee = typeof employees.$inferInsert;
type EmployeeWithSchools = Employee & { schoolIds?: number[] };

export async function getEmployee(empNo: string) {
	return service.get(empNo);
}

export async function findAllEmployees(page: number = 1, search = '') {
	return service.findAll(page, search);
}

export async function createEmployee(employee: EmployeeWithSchools) {
	return service.create({
		...employee,
		name: formatPersonName(employee.name) ?? employee.name,
	});
}

export async function updateEmployee(
	empNo: string,
	employee: EmployeeWithSchools
) {
	return service.update(empNo, {
		...employee,
		name: formatPersonName(employee.name) ?? employee.name,
	});
}

export async function deleteEmployee(empNo: string) {
	return service.delete(empNo);
}

export async function logEmployeeCardPrint(empNo: string) {
	return service.logCardPrint(empNo);
}

export async function getEmployeeCardPrintHistory(empNo: string) {
	return service.getCardPrintHistory(empNo);
}

export async function getEmployeePhoto(
	empNo: string | undefined | null
): Promise<string | null> {
	if (!empNo) return null;
	try {
		const photoKey = await service.getPhotoKey(empNo);
		if (!photoKey) return null;

		const url = getPublicUrl(photoKey);
		const response = await fetch(url, {
			method: 'HEAD',
			cache: 'no-store',
			next: { revalidate: 0 },
		});
		if (!response.ok) {
			return null;
		}

		const etag = response.headers.get('etag')?.replace(/"/g, '') || '';
		const lastModified = response.headers.get('last-modified') || '';
		const versionSource = etag || lastModified || Date.now().toString();
		return `${url}?v=${encodeURIComponent(versionSource)}`;
	} catch (error) {
		console.error('Error checking employee photo:', error);
		return null;
	}
}

export async function uploadEmployeePhoto(empNo: string, photo: File) {
	return service.uploadPhoto(empNo, photo);
}
