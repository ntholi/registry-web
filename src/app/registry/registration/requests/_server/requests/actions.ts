'use server';

import type { AcademicRemarks, Student } from '@registry/students';
import type { ReceiptType, StudentModuleStatus } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { isActiveSemester } from '@/shared/lib/utils/utils';
import { registrationRequestsService as service } from './service';

type ModuleWithStatus = {
	semesterModuleId: number;
	code: string;
	name: string;
	type: string;
	credits: number;
	status: 'Compulsory' | 'Elective' | `Repeat${number}`;
	semesterNo: string;
	prerequisites?: Array<{ id: number; code: string; name: string }>;
};

export const getRegistrationRequest = createAction(async (id: number) =>
	service.get(id)
);

export const countByStatus = createAction(
	async (status: 'pending' | 'registered' | 'rejected' | 'approved') =>
		service.countByStatus(status)
);

export const findAllRegistrationRequests = createAction(
	async (
		page: number = 1,
		search: string = '',
		termId?: number,
		includeDeleted: boolean = false
	) => service.findAll({ page, search, includeDeleted }, termId)
);

export const getStudentSemesterModules = createAction(
	async (student: Student, remarks: AcademicRemarks, termCode?: string) =>
		service.getStudentSemesterModules(student, remarks, termCode)
);

export const getExistingRegistrationSponsorship = createAction(
	async (stdNo: number, termId: number) =>
		service.getExistingRegistrationSponsorship(stdNo, termId)
);

export const checkIsAdditionalRequest = createAction(
	async (stdNo: number, termId: number) =>
		service.checkIsAdditionalRequest(stdNo, termId)
);

export const getExistingSemesterStatus = createAction(
	async (stdNo: number, termId: number) =>
		service.getExistingSemesterStatus(stdNo, termId)
);

export const determineSemesterStatus = createAction(
	async (modules: ModuleWithStatus[], student: Student) => {
		const semesterNo = commonSemesterNo(modules);
		const completedSemesters =
			student?.programs
				.filter((p) => p.status === 'Active')
				.flatMap((program) => program.semesters)
				.filter((s) => isActiveSemester(s.status))
				.map((semester) => semester.structureSemester?.semesterNumber)
				.filter(
					(semesterNo): semesterNo is string =>
						semesterNo !== null && semesterNo !== undefined
				) ?? [];

		const hasCompletedSemester = completedSemesters.some(
			(s) => Number.parseInt(s, 10) === Number.parseInt(semesterNo, 10)
		);

		return {
			semesterNo: semesterNo,
			status: (hasCompletedSemester ? 'Repeat' : 'Active') as
				| 'Active'
				| 'Repeat',
		};
	}
);

export const deleteRegistrationRequest = createAction(async (id: number) =>
	service.delete(id)
);

export const createRegistration = createAction(
	async (data: {
		stdNo: number;
		modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
		sponsorId: number;
		semesterNumber: string;
		semesterStatus: 'Active' | 'Repeat';
		termId: number;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
		receipts?: { receiptNo: string; receiptType: ReceiptType }[];
	}) => service.createWithModules(data)
);

export const updateRegistration = createAction(
	async (
		registrationRequestId: number,
		modules: {
			id: number;
			status: StudentModuleStatus;
			receiptNumber?: string;
		}[],
		sponsorshipData?: {
			sponsorId: number;
			borrowerNo?: string;
			bankName?: string;
			accountNumber?: string;
		},
		semesterNumber?: string,
		semesterStatus?: 'Active' | 'Repeat',
		termId?: number,
		receipts?: { receiptNo: string; receiptType: ReceiptType }[]
	) =>
		service.updateWithModules(
			registrationRequestId,
			modules,
			sponsorshipData,
			semesterNumber,
			semesterStatus,
			termId,
			receipts
		)
);

export const getStudentRegistrationHistory = createAction(
	async (stdNo: number) => service.getHistory(stdNo)
);

export const getEligibleModulesForRequest = createAction(
	async (stdNo: number, termCode: string) =>
		service.getEligibleModulesForRequest(stdNo, termCode)
);

function commonSemesterNo(modules: ModuleWithStatus[]): string {
	const semesterCounts = new Map<string, number>();

	for (const m of modules) {
		const normalized = m.semesterNo.padStart(2, '0');
		const count = semesterCounts.get(normalized) || 0;
		semesterCounts.set(normalized, count + 1);
	}

	let mostCommonSemester = modules[0]?.semesterNo.padStart(2, '0') || '01';
	let maxCount = 0;

	for (const [semesterNo, count] of semesterCounts) {
		if (count > maxCount) {
			maxCount = count;
			mostCommonSemester = semesterNo;
		}
	}

	return mostCommonSemester;
}
