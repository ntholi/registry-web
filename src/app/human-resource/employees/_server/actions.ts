'use server';

import type { employees } from '@/core/database';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { createAction } from '@/shared/lib/utils/actionResult';
import { formatPersonName } from '@/shared/lib/utils/names';
import { employeesService as service } from './service';

type Employee = typeof employees.$inferInsert;
type EmployeeWithSchools = Employee & { schoolIds?: number[] };

export const getEmployee = createAction(async (empNo: string) => {
	return service.get(empNo);
});

export const findAllEmployees = createAction(
	async (page: number = 1, search: string = '') => {
		return service.findAll(page, search);
	}
);

export const createEmployee = createAction(
	async (employee: EmployeeWithSchools) => {
		return service.create({
			...employee,
			name: formatPersonName(employee.name) ?? employee.name,
		});
	}
);

export const updateEmployee = createAction(
	async (empNo: string, employee: EmployeeWithSchools) => {
		return service.update(empNo, {
			...employee,
			name: formatPersonName(employee.name) ?? employee.name,
		});
	}
);

export const deleteEmployee = createAction(async (empNo: string) => {
	return service.delete(empNo);
});

export const logEmployeeCardPrint = createAction(async (empNo: string) => {
	return service.logCardPrint(empNo);
});

export const getEmployeeCardPrintHistory = createAction(
	async (empNo: string) => {
		return service.getCardPrintHistory(empNo);
	}
);

export const getEmployeePhoto = createAction(
	async (empNo: string | undefined | null): Promise<string | null> => {
		if (!empNo) return null;
		const photoKey = await service.getPhotoKey(empNo);
		if (!photoKey) return null;
		return getPublicUrl(photoKey);
	}
);

export const uploadEmployeePhoto = createAction(
	async (empNo: string, photo: File) => {
		return service.uploadPhoto(empNo, photo);
	}
);
