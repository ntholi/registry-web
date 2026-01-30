'use server';

import type { AcademicRemarks, Student } from '@registry/students';
import type { ReceiptType, StudentModuleStatus } from '@/core/database';
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

export async function getRegistrationRequest(id: number) {
	return service.get(id);
}

export async function countByStatus(
	status: 'pending' | 'registered' | 'rejected' | 'approved'
) {
	return service.countByStatus(status);
}

export async function findAllRegistrationRequests(
	page = 1,
	search = '',
	termId?: number,
	includeDeleted = false
) {
	return service.findAll({ page, search, includeDeleted }, termId);
}

export async function getStudentSemesterModules(
	student: Student,
	remarks: AcademicRemarks
) {
	return service.getStudentSemesterModules(student, remarks);
}

export async function determineSemesterStatus(
	modules: ModuleWithStatus[],
	student: Student
) {
	const semesterNo = commonSemesterNo(modules);
	const completedSemesters =
		student?.programs
			.filter((p) => p.status === 'Active')
			.flatMap((program) => program.semesters)
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
		status: (hasCompletedSemester ? 'Repeat' : 'Active') as 'Active' | 'Repeat',
	};
}

export async function deleteRegistrationRequest(id: number) {
	return service.delete(id);
}

export async function createRegistration(data: {
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
}) {
	return service.createWithModules(data);
}

export async function updateRegistration(
	registrationRequestId: number,
	modules: { id: number; status: StudentModuleStatus }[],
	sponsorshipData?: {
		sponsorId: number;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
	},
	semesterNumber?: string,
	semesterStatus?: 'Active' | 'Repeat',
	termId?: number
) {
	return service.updateWithModules(
		registrationRequestId,
		modules,
		sponsorshipData,
		semesterNumber,
		semesterStatus,
		termId
	);
}

export async function getStudentRegistrationHistory(stdNo: number) {
	return service.getHistory(stdNo);
}

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
