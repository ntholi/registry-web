import type { AcademicRemarks, Student } from '@registry/students';
import { getStudentRegistrationData } from '@registry/students/_server/actions';
import { getActiveTerm } from '@/app/registry/terms';
import {
	hasAnyPermission,
	hasPermission,
} from '@/core/auth/sessionPermissions';
import { unwrap } from '@/shared/lib/utils/actionResult';
import type {
	ReceiptType,
	registrationRequests,
	StudentModuleStatus,
} from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';
import { getStudentSemesterModulesLogic } from './getStudentSemesterModules';
import RegistrationRequestRepository from './repository';

type RegistrationRequestQuery = QueryOptions<typeof registrationRequests> & {
	includeDeleted?: boolean;
};

class RegistrationRequestService {
	constructor(
		private readonly repository = new RegistrationRequestRepository()
	) {}

	async getHistory(stdNo: number) {
		return withPermission(
			async () => this.repository.getHistory(stdNo),
			async (session) =>
				session?.user?.stdNo === stdNo ||
				hasPermission(session, 'registration', 'read')
		);
	}

	async findAll(params: RegistrationRequestQuery, termId?: number) {
		return withPermission(
			async () => this.repository.findAllPaginated(params, termId),
			{ registration: ['read'] }
		);
	}

	async countByStatus(
		status: 'pending' | 'registered' | 'rejected' | 'approved'
	) {
		const term = unwrap(await getActiveTerm());
		return withPermission(
			async () => this.repository.countByStatus(status, term.id),
			{ registration: ['read'] }
		);
	}

	async get(id: number) {
		return withPermission(
			async () => {
				const result = await this.repository.findById(id);
				if (!result) return null;
				const activeProgram = result.student.programs.at(0);
				return {
					...result,
					programName: activeProgram?.structure.program.name,
					structureId: activeProgram?.structureId,
				};
			},
			{ registration: ['read'] }
		);
	}

	async delete(id: number) {
		return withPermission(
			async (session) => {
				const userId = session?.user?.id ?? null;
				return this.repository.softDelete(id, userId, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'registration_cancelled',
				});
			},
			{ registration: ['delete'] }
		);
	}

	async createWithModules(data: {
		stdNo: number;
		termId: number;
		modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
		sponsorId: number;
		semesterStatus: 'Active' | 'Repeat';
		semesterNumber: string;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
		receipts?: { receiptNo: string; receiptType: ReceiptType }[];
	}) {
		if (!data.semesterNumber?.trim()) {
			throw new Error('Semester number is required and cannot be blank.');
		}

		return withPermission(
			async (session) => {
				return this.repository.createWithModules(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'registration_submitted',
				});
			},
			async (session) =>
				session?.user?.stdNo === data.stdNo ||
				hasAnyPermission(session, 'registration', ['create', 'update'])
		);
	}

	async updateWithModules(
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
	) {
		return withPermission(
			async (session) => {
				return this.repository.updateWithModules(
					registrationRequestId,
					modules,
					sponsorshipData,
					semesterNumber,
					semesterStatus,
					termId,
					receipts,
					{
						userId: session!.user!.id!,
						role: session!.user!.role!,
						activityType: 'registration_updated',
					}
				);
			},
			async (session) =>
				hasAnyPermission(session, 'registration', ['create', 'update'])
		);
	}

	async getStudentSemesterModules(
		student: Student,
		remarks: AcademicRemarks,
		termCode?: string
	) {
		return withPermission(
			async () => {
				return getStudentSemesterModulesLogic(student, remarks, termCode);
			},
			async (session) =>
				session?.user?.stdNo === student.stdNo ||
				hasAnyPermission(session, 'registration', ['create', 'update'])
		);
	}

	async getExistingRegistrationSponsorship(stdNo: number, termId: number) {
		return withPermission(
			async () =>
				this.repository.getExistingRegistrationSponsorship(stdNo, termId),
			async (session) =>
				session?.user?.stdNo === stdNo ||
				hasAnyPermission(session, 'registration', ['create', 'update'])
		);
	}

	async checkIsAdditionalRequest(stdNo: number, termId: number) {
		return withPermission(
			async () => {
				const existingSemester =
					await this.repository.findExistingStudentSemester(stdNo, termId);
				return !!existingSemester;
			},
			async (session) =>
				session?.user?.stdNo === stdNo ||
				hasAnyPermission(session, 'registration', ['create', 'update'])
		);
	}

	async getExistingSemesterStatus(stdNo: number, termId: number) {
		return withPermission(
			async () => {
				const existingSemester =
					await this.repository.findExistingStudentSemester(stdNo, termId);
				if (!existingSemester) return null;
				const semesterNo =
					existingSemester.structureSemester?.semesterNumber ?? '01';
				const status =
					existingSemester.status === 'Repeat' ? 'Repeat' : 'Active';
				return {
					semesterNo,
					status: status as 'Active' | 'Repeat',
				};
			},
			async (session) =>
				session?.user?.stdNo === stdNo ||
				hasAnyPermission(session, 'registration', ['create', 'update'])
		);
	}

	async getEligibleModulesForRequest(stdNo: number, termCode: string) {
		return withPermission(
			async () => {
				const studentData = unwrap(await getStudentRegistrationData(stdNo));
				if (!studentData) throw new Error('Student not found');
				const remarks = getAcademicRemarks(studentData.programs);
				return getStudentSemesterModulesLogic(studentData, remarks, termCode);
			},
			{ registration: ['create'] }
		);
	}

	async getForProofOfRegistration(registrationId: number) {
		return withPermission(
			async () => {
				const result = await this.repository.findById(registrationId);
				if (!result) return null;

				const activeProgram = result.student.programs.at(0);

				return {
					stdNo: result.stdNo,
					name: result.student.name,
					program: activeProgram?.structure.program.name ?? '',
					faculty: '',
					semesterNumber: result.semesterNumber ?? '',
					semesterStatus: result.semesterStatus ?? '',
					termCode: result.term?.code ?? '',
					modules: result.requestedModules.map((rm) => ({
						code: rm.semesterModule.module?.code ?? '',
						name: rm.semesterModule.module?.name ?? '',
						credits:
							(rm.semesterModule.module as { credits?: number })?.credits ?? 0,
						type: '',
						semesterNumber: result.semesterNumber ?? '',
					})),
					sponsor: result.sponsoredStudent?.sponsor?.name,
					registrationDate: result.createdAt ?? new Date(),
				};
			},
			{ registration: ['read'] }
		);
	}
}

export const registrationRequestsService = serviceWrapper(
	RegistrationRequestService,
	'RegistrationRequestsService'
);
