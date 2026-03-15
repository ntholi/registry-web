'use server';

import { revalidatePath } from 'next/cache';
import { getUnpublishedTermCodes } from '@/app/registry/terms/settings/_server/actions';
import { auth } from '@/core/auth';
import { hasPermission } from '@/core/auth/sessionPermissions';
import type {
	nextOfKins,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
} from '@/core/database';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
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

export const getStudent = createAction(async (stdNo: number) =>
	service.get(stdNo)
);

export const getAcademicHistory = createAction(
	async (stdNo: number, excludedTerms: string[] = []) =>
		service.getAcademicHistory(stdNo, excludedTerms)
);

export const getPublishedAcademicHistory = createAction(
	async (stdNo: number) => {
		const unpublishedTerms = unwrap(await getUnpublishedTermCodes());
		return service.getAcademicHistory(stdNo, unpublishedTerms);
	}
);

export const getStudentByUserId = createAction(
	async (userId: string | undefined | null) => {
		if (!userId) return;
		return service.findStudentByUserId(userId);
	}
);

export const getStdNoByUserId = createAction(async (userId: string) =>
	service.getStdNoByUserId(userId)
);

export const getStudentsBySemesterModules = createAction(
	async (semesterModuleIds: number[]) =>
		service.findBySemesterModules(semesterModuleIds)
);

export const getStudentRegistrationData = createAction(async (stdNo: number) =>
	service.getRegistrationData(stdNo)
);

export const getStudentRegistrationDataByTerm = createAction(
	async (stdNo: number, termCode: string) =>
		service.getRegistrationDataByTerm(stdNo, termCode)
);

export const findAllStudents = createAction(
	async (page: number = 1, search: string = '', filter?: StudentFilter) => {
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
);

export const createStudent = createAction(async (student: Student) =>
	service.create({
		...student,
		name: formatPersonName(student.name) ?? student.name,
	})
);

export const updateStudent = createAction(
	async (stdNo: number, student: Student) =>
		service.update(stdNo, {
			...student,
			name: formatPersonName(student.name) ?? student.name,
		})
);

export const updateStudentWithReasons = createAction(
	async (stdNo: number, data: Partial<Student>, reasons?: string) => {
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
);

export const updateStudentProgram = createAction(
	async (
		id: number,
		data: Partial<typeof studentPrograms.$inferInsert>,
		stdNo: number,
		reasons?: string
	) => {
		const result = await service.updateStudentProgram(id, data, stdNo, reasons);
		revalidatePath('/registry/students');
		return result;
	}
);

export const createStudentProgram = createAction(
	async (data: typeof studentPrograms.$inferInsert, reasons?: string) => {
		const result = await service.createStudentProgram(data, reasons);
		revalidatePath('/registry/students');
		return result;
	}
);

export const updateStudentSemester = createAction(
	async (
		id: number,
		data: Partial<typeof studentSemesters.$inferInsert>,
		stdNo: number,
		reasons?: string
	) => {
		const result = await service.updateStudentSemester(
			id,
			data,
			stdNo,
			reasons
		);
		revalidatePath('/registry/students');
		return result;
	}
);

export const updateStudentForStatusWorkflow = createAction(
	async (
		stdNo: number,
		status: NonNullable<Student['status']>,
		reasons?: string
	) => {
		const result = await service.updateForStatusWorkflow(
			stdNo,
			status,
			reasons
		);
		revalidatePath('/registry/students');
		return result;
	}
);

interface StatusWorkflowSemesterInput {
	status: NonNullable<(typeof studentSemesters.$inferInsert)['status']>;
	stdNo: number;
	reasons?: string;
}

export const updateStudentSemesterForStatusWorkflow = createAction(
	async (id: number, data: StatusWorkflowSemesterInput) => {
		const result = await service.updateStudentSemesterForStatusWorkflow(
			id,
			data.status,
			data.stdNo,
			data.reasons
		);
		revalidatePath('/registry/students');
		return result;
	}
);

export const updateStudentModule = createAction(
	async (
		id: number,
		data: Partial<typeof studentModules.$inferInsert>,
		stdNo: number,
		reasons?: string
	) => {
		const result = await service.updateStudentModule(id, data, stdNo, reasons);
		revalidatePath('/registry/students');
		return result;
	}
);

export const canEditMarksAndGrades = createAction(async () => {
	const session = await auth();
	return (
		session?.user?.role === 'admin' ||
		(session?.user?.role === 'registry' &&
			hasPermission(session, 'activity-tracker', 'read'))
	);
});

export interface CreateFullStudentInput {
	student: Omit<typeof students.$inferInsert, 'stdNo'>;
	nextOfKins: Omit<typeof nextOfKins.$inferInsert, 'stdNo'>[];
	program: Omit<typeof studentPrograms.$inferInsert, 'stdNo'>;
}

export const createFullStudent = createAction(
	async (input: CreateFullStudentInput) => {
		const dob = input.student.dateOfBirth;
		const result = await service.createFull({
			student: {
				...input.student,
				name: formatPersonName(input.student.name) ?? input.student.name,
				dateOfBirth: dob ? new Date(dob) : undefined,
			},
			nextOfKins: input.nextOfKins,
			program: input.program,
		});
		revalidatePath('/registry/students');
		return result;
	}
);

export const updateStudentUserId = createAction(
	async (stdNo: number, userId: string | null) => {
		const res = service.updateUserId(stdNo, userId);
		revalidatePath(`/dashboard/students/${stdNo}`);
		return res;
	}
);

export const saveZohoContactId = createAction(
	async (stdNo: number, zohoContactId: string) =>
		service.saveZohoContactId(stdNo, zohoContactId)
);

export const updateStudentProgramStructure = createAction(
	async (stdNo: number, structureId: number) => {
		const res = await service.updateProgramStructure(stdNo, structureId);
		revalidatePath(`/registry/students/${stdNo}`);
		return res;
	}
);

export const getStudentPhoto = createAction(
	async (studentNumber: number | undefined | null): Promise<string | null> => {
		if (!studentNumber) return null;
		const photoKey = await service.getPhotoKey(studentNumber);
		if (!photoKey) return null;
		return getPublicUrl(photoKey);
	}
);

export const uploadStudentPhoto = createAction(
	async (stdNo: number, photo: File) => {
		const result = await service.uploadPhoto(stdNo, photo);
		revalidatePath(`/registry/students/${stdNo}`);
		return result;
	}
);

export const getStudentFilterInfo = createAction(async (stdNo: number) => {
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
});
