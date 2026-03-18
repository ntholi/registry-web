'use server';

import type { employees } from '@/core/database';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { createAction } from '@/shared/lib/actions/actionResult';
import { formatPersonName } from '@/shared/lib/utils/names';
import { employeesService as service } from './service';

type Employee = typeof employees.$inferInsert;
type EmployeeWithSchools = Employee & { schoolIds?: number[] };

export async function getEmployee(empNo: string) {
	return service.get(empNo);
}

export async function getCurrentEmployee() {
	return service.getCurrent();
}

export async function findAllEmployees(page: number = 1, search = '') {
	return service.findAll(page, search);
}

export const createEmployee = createAction(
	async (employee: EmployeeWithSchools) =>
		service.create({
			...employee,
			name: formatPersonName(employee.name) ?? employee.name,
		})
);

export const updateEmployee = createAction(
	async (empNo: string, employee: EmployeeWithSchools) =>
		service.update(empNo, {
			...employee,
			name: formatPersonName(employee.name) ?? employee.name,
		})
);

export const deleteEmployee = createAction(async (empNo: string) =>
	service.delete(empNo)
);

export const logEmployeeCardPrint = createAction(async (empNo: string) =>
	service.logCardPrint(empNo)
);

export async function getEmployeeCardPrintHistory(empNo: string) {
	return service.getCardPrintHistory(empNo);
}

export async function getEmployeePhoto(
	empNo: string | undefined | null
): Promise<string | null> {
	if (!empNo) return null;
	const photoKey = await service.getPhotoKey(empNo);
	if (!photoKey) return null;
	return getPublicUrl(photoKey);
}

export const uploadEmployeePhoto = createAction(
	async (empNo: string, photo: File) => service.uploadPhoto(empNo, photo)
);
