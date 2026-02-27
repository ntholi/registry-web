'use server';

import type { employees } from '@/core/database';
import { employeesService as service } from './service';

type Employee = typeof employees.$inferInsert;

export async function getEmployee(empNo: string) {
	return service.get(empNo);
}

export async function findAllEmployees(page: number = 1, search = '') {
	return service.findAll(page, search);
}

export async function createEmployee(employee: Employee) {
	return service.create(employee);
}

export async function updateEmployee(empNo: string, employee: Employee) {
	return service.update(empNo, employee);
}

export async function deleteEmployee(empNo: string) {
	return service.delete(empNo);
}

export async function getEmployeePhoto(
	empNo: string | undefined | null
): Promise<string | null> {
	if (!empNo) return null;
	try {
		const extensions = ['jpg', 'jpeg', 'png', 'webp'];

		for (const ext of extensions) {
			const fileName = `${empNo}.${ext}`;
			const url = `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/photos/employees/${fileName}`;

			try {
				const response = await fetch(url, {
					method: 'HEAD',
					cache: 'no-store',
					next: { revalidate: 0 },
				});
				if (response.ok) {
					const etag = response.headers.get('etag')?.replace(/"/g, '') || '';
					const lastModified = response.headers.get('last-modified') || '';
					const versionSource = etag || lastModified || Date.now().toString();
					return `${url}?v=${encodeURIComponent(versionSource)}`;
				}
			} catch (error) {
				console.error('Error:', error);
			}
		}

		return null;
	} catch (error) {
		console.error('Error checking employee photo:', error);
		return null;
	}
}
