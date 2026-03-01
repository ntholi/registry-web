'use server';

import { revalidatePath } from 'next/cache';
import { getUnpublishedTermCodes } from '@/app/registry/terms/settings/_server/actions';
import { auth } from '@/core/auth';
import type {
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
} from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { formatPersonName } from '@/shared/lib/utils/names';
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
	return service.create({
		...student,
		name: formatPersonName(student.name) ?? student.name,
	});
}

export async function updateStudent(stdNo: number, student: Student) {
	return service.update(stdNo, {
		...student,
		name: formatPersonName(student.name) ?? student.name,
	});
}

export async function updateStudentWithReasons(
	stdNo: number,
	data: Partial<Student>,
	reasons?: string
) {
	const result = await service.updateWithReasons(
		stdNo,
		{
			...data,
			name: formatPersonName(data.name) ?? data.name,
		},
		reasons
	);
	revalidatePath(`/registry/students/${stdNo}`);
	return result;
}

export async function updateStudentProgram(
	id: number,
	data: Partial<typeof studentPrograms.$inferInsert>,
	stdNo: number,
	reasons?: string
) {
	const result = await service.updateStudentProgram(id, data, stdNo, reasons);
	revalidatePath('/registry/students');
	return result;
}

export async function createStudentProgram(
	data: typeof studentPrograms.$inferInsert,
	reasons?: string
) {
	const result = await service.createStudentProgram(data, reasons);
	revalidatePath('/registry/students');
	return result;
}

export async function updateStudentSemester(
	id: number,
	data: Partial<typeof studentSemesters.$inferInsert>,
	stdNo: number,
	reasons?: string
) {
	const result = await service.updateStudentSemester(id, data, stdNo, reasons);
	revalidatePath('/registry/students');
	return result;
}

export async function updateStudentForStatusWorkflow(
	stdNo: number,
	status: NonNullable<Student['status']>,
	reasons?: string
) {
	const result = await service.updateForStatusWorkflow(stdNo, status, reasons);
	revalidatePath('/registry/students');
	return result;
}

interface StatusWorkflowSemesterInput {
	status: NonNullable<(typeof studentSemesters.$inferInsert)['status']>;
	stdNo: number;
	reasons?: string;
}

export async function updateStudentSemesterForStatusWorkflow(
	id: number,
	data: StatusWorkflowSemesterInput
) {
	const result = await service.updateStudentSemesterForStatusWorkflow(
		id,
		data.status,
		data.stdNo,
		data.reasons
	);
	revalidatePath('/registry/students');
	return result;
}

export async function updateStudentModule(
	id: number,
	data: Partial<typeof studentModules.$inferInsert>,
	stdNo: number,
	reasons?: string
) {
	const result = await service.updateStudentModule(id, data, stdNo, reasons);
	revalidatePath('/registry/students');
	return result;
}

export async function canEditMarksAndGrades() {
	const session = await auth();
	const isAdmin = session?.user?.role === 'admin';
	const isRegistryManager =
		session?.user?.role === 'registry' && session?.user?.position === 'manager';
	return isAdmin || isRegistryManager;
}

export async function updateStudentUserId(
	stdNo: number,
	userId: string | null
) {
	const res = service.updateUserId(stdNo, userId);
	revalidatePath(`/dashboard/students/${stdNo}`);
	return res;
}

export async function saveZohoContactId(stdNo: number, zohoContactId: string) {
	return service.saveZohoContactId(stdNo, zohoContactId);
}

export async function updateStudentProgramStructure(
	stdNo: number,
	structureId: number
) {
	const res = await service.updateProgramStructure(stdNo, structureId);
	revalidatePath(`/registry/students/${stdNo}`);
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

export async function getStudentFilterInfo(stdNo: number) {
	const student = await service.get(stdNo);
	if (!student) return null;

	const activeProgram = student.programs.find((p) => p.status === 'Active');
	if (!activeProgram) return null;

	const latestSemester = activeProgram.semesters
		.slice()
		.sort((a, b) => b.termCode.localeCompare(a.termCode))[0];

	return {
		schoolId: activeProgram.structure.program.school.id,
		programId: activeProgram.structure.program.id,
		termCode: latestSemester?.termCode,
		semesterNumber: latestSemester?.structureSemester.semesterNumber,
	};
}
