'use server';

import { revalidatePath } from 'next/cache';
import { getUnpublishedTermCodes } from '@/app/registry/terms/settings/_server/actions';
import type { students } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { studentsService as service } from './service';

type Student = typeof students.$inferInsert;

export interface StudentFilter {
	schoolId?: number;
	programId?: number;
	termId?: number;
	semesterNumber?: string;
}

type StudentQueryParams = Omit<QueryOptions<typeof students>, 'filter'> & {
	filter?: StudentFilter;
};

export async function getStudent(stdNo: number) {
	return service.get(stdNo);
}

export async function getAcademicHistory(
	stdNo: number,
	excludedTerms: string[] = []
) {
	return service.getAcademicHistory(stdNo, excludedTerms);
}

export async function getPublishedAcademicHistory(stdNo: number) {
	const unpublishedTerms = await getUnpublishedTermCodes();
	return service.getAcademicHistory(stdNo, unpublishedTerms);
}

export async function getStudentByUserId(userId: string | undefined | null) {
	if (!userId) return;
	return service.findStudentByUserId(userId);
}

export async function getStudentsBySemesterModules(
	semesterModuleIds: number[]
) {
	return service.findBySemesterModules(semesterModuleIds);
}

export async function getStudentRegistrationData(stdNo: number) {
	return service.getRegistrationData(stdNo);
}

export async function getStudentRegistrationDataByTerm(
	stdNo: number,
	termCode: string
) {
	return service.getRegistrationDataByTerm(stdNo, termCode);
}

export async function findAllStudents(
	page: number = 1,
	search = '',
	filter?: StudentFilter
) {
	const params: StudentQueryParams = {
		page,
		search,
		searchColumns: ['stdNo', 'name'],
	};
	if (filter) {
		params.filter = filter;
	}
	return service.findAll(
		params as QueryOptions<typeof students> & { filter?: StudentFilter }
	);
}

export async function createStudent(student: Student) {
	return service.create(student);
}

export async function updateStudent(stdNo: number, student: Student) {
	return service.update(stdNo, student);
}

export async function updateStudentUserId(
	stdNo: number,
	userId: string | null
) {
	const res = service.updateUserId(stdNo, userId);
	revalidatePath(`/dashboard/students/${stdNo}`);
	return res;
}

export async function getStudentPhoto(
	studentNumber: number | undefined | null
): Promise<string | null> {
	if (!studentNumber) return null;
	try {
		const extensions = ['jpg', 'jpeg', 'png', 'webp'];

		for (const ext of extensions) {
			const fileName = `${studentNumber}.${ext}`;
			const url = `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/photos/${fileName}`;

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
		console.error('Error checking student photo:', error);
		return null;
	}
}
