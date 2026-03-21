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
import { uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	getPublicUrl,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { createAction } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import { formatPersonName } from '@/shared/lib/utils/names';
import { studentsService as service } from './service';

export type AuditAttachmentInfo = {
	fileName: string;
	fileKey: string;
	fileSize: number;
};

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

export async function getStdNoByUserId(userId: string) {
	return service.getStdNoByUserId(userId);
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

export const createStudent = createAction(async (student: Student) => {
	return service.create({
		...student,
		name: formatPersonName(student.name) ?? student.name,
	});
});

export const updateStudent = createAction(
	async (stdNo: number, student: Student) => {
		return service.update(stdNo, {
			...student,
			name: formatPersonName(student.name) ?? student.name,
		});
	}
);

export const updateStudentWithReasons = createAction(
	async (
		stdNo: number,
		data: Partial<Student>,
		reasons?: string,
		attachments?: AuditAttachmentInfo[]
	) => {
		const result = await service.updateWithReasons(
			stdNo,
			{
				...data,
				name: formatPersonName(data.name) ?? data.name,
			},
			reasons,
			attachments
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
		reasons?: string,
		attachments?: AuditAttachmentInfo[]
	) => {
		const result = await service.updateStudentProgram(
			id,
			data,
			stdNo,
			reasons,
			attachments
		);
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
		reasons?: string,
		attachments?: AuditAttachmentInfo[]
	) => {
		const result = await service.updateStudentSemester(
			id,
			data,
			stdNo,
			reasons,
			attachments
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
		reasons?: string,
		attachments?: AuditAttachmentInfo[]
	) => {
		const result = await service.updateStudentModule(
			id,
			data,
			stdNo,
			reasons,
			attachments
		);
		revalidatePath('/registry/students');
		return result;
	}
);

export async function canEditMarksAndGrades() {
	const session = await auth();
	return (
		session?.user?.role === 'admin' ||
		(session?.user?.role === 'registry' &&
			hasPermission(session, 'activity-tracker', 'read'))
	);
}

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
		const result = await service.updateUserId(stdNo, userId);
		revalidatePath(`/dashboard/students/${stdNo}`);
		return result;
	}
);

export const saveZohoContactId = createAction(
	async (stdNo: number, zohoContactId: string) => {
		return service.saveZohoContactId(stdNo, zohoContactId);
	}
);

export const updateStudentProgramStructure = createAction(
	async (stdNo: number, structureId: number) => {
		const result = await service.updateProgramStructure(stdNo, structureId);
		revalidatePath(`/registry/students/${stdNo}`);
		return result;
	}
);

export async function getStudentPhoto(
	studentNumber: number | undefined | null
): Promise<string | null> {
	if (!studentNumber) return null;
	const photoKey = await service.getPhotoKey(studentNumber);
	if (!photoKey) return null;
	return getPublicUrl(photoKey);
}

export const uploadStudentPhoto = createAction(
	async (stdNo: number, photo: File) => {
		const result = await service.uploadPhoto(stdNo, photo);
		revalidatePath(`/registry/students/${stdNo}`);
		return result;
	}
);

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

export const uploadAuditAttachment = createAction(
	async (formData: FormData) => {
		const file = formData.get('file') as File | null;
		if (!file) throw new UserFacingError('No file provided');

		const key = generateUploadKey(StoragePaths.auditAttachment, file.name);
		await uploadFile(file, key);

		return {
			fileName: file.name,
			fileKey: key,
			fileSize: file.size,
		} satisfies AuditAttachmentInfo;
	}
);
