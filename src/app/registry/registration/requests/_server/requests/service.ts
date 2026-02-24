import type { AcademicRemarks, Student } from '@registry/students';
import { getSponsor } from '@/app/finance/sponsors';
import { getActiveTerm } from '@/app/registry/terms';
import {
	dashboardUsers,
	type ReceiptType,
	type registrationRequests,
	type StudentModuleStatus,
} from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
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
		return withAuth(
			async () => this.repository.getHistory(stdNo),
			['dashboard', 'student']
		);
	}

	async findAll(params: RegistrationRequestQuery, termId?: number) {
		return withAuth(
			async () => this.repository.findAllPaginated(params, termId),
			['registry', 'finance', 'library']
		);
	}

	async countByStatus(
		status: 'pending' | 'registered' | 'rejected' | 'approved'
	) {
		const term = await getActiveTerm();
		return withAuth(
			async () => this.repository.countByStatus(status, term.id),
			['dashboard']
		);
	}

	async get(id: number) {
		return withAuth(
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
			async (session) => {
				if (
					session.user?.role &&
					dashboardUsers.enumValues.includes(
						session.user.role as (typeof dashboardUsers.enumValues)[number]
					)
				) {
					return true;
				}

				const allowedRoles = ['admin', 'registry', 'student', 'leap'];
				const allowedPositions = [
					'admin',
					'manager',
					'program_leader',
					'year_leader',
				];

				return (
					allowedRoles.includes(session.user?.role || '') ||
					allowedPositions.includes(session.user?.position || '')
				);
			}
		);
	}

	async delete(id: number) {
		return withAuth(
			async (session) => {
				const userId = session?.user?.id ?? null;
				return this.repository.softDelete(id, userId, {
					userId: session!.user!.id!,
				});
			},
			['registry']
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
		const sponsor = await getSponsor(data.sponsorId);
		const isSelfSponsored = sponsor?.code === 'PRV';

		if (!isSelfSponsored) {
			const repeatModules = data.modules.filter((m) =>
				m.moduleStatus.startsWith('Repeat')
			);
			const repeatReceipts =
				data.receipts?.filter((r) => r.receiptType === 'repeat_module') || [];

			if (repeatModules.length > 0 && repeatReceipts.length === 0) {
				throw new Error(
					'A receipt is required for repeat modules. Please ensure all repeat modules have a receipt number attached.'
				);
			}
		}

		return withAuth(
			async (session) => {
				return this.repository.createWithModules(data, {
					userId: session!.user!.id!,
				});
			},
			async (session) =>
				session.user?.stdNo === data.stdNo || session.user?.role === 'registry'
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
		return withAuth(
			async (session) => {
				return this.repository.updateWithModules(
					registrationRequestId,
					modules,
					sponsorshipData,
					semesterNumber,
					semesterStatus,
					termId,
					receipts,
					{ userId: session!.user!.id! }
				);
			},
			['student', 'registry']
		);
	}

	async getStudentSemesterModules(
		student: Student,
		remarks: AcademicRemarks,
		termCode?: string
	) {
		return withAuth(async () => {
			return getStudentSemesterModulesLogic(student, remarks, termCode);
		}, ['student', 'registry']);
	}

	async getExistingRegistrationSponsorship(stdNo: number, termId: number) {
		return withAuth(
			async () =>
				this.repository.getExistingRegistrationSponsorship(stdNo, termId),
			async (session) =>
				session.user?.stdNo === stdNo || session.user?.role === 'registry'
		);
	}

	async checkIsAdditionalRequest(stdNo: number, termId: number) {
		return withAuth(
			async () => {
				const existingSemester =
					await this.repository.findExistingStudentSemester(stdNo, termId);
				return !!existingSemester;
			},
			async (session) =>
				session.user?.stdNo === stdNo || session.user?.role === 'registry'
		);
	}

	async getExistingSemesterStatus(stdNo: number, termId: number) {
		return withAuth(
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
				session.user?.stdNo === stdNo || session.user?.role === 'registry'
		);
	}

	async getForProofOfRegistration(registrationId: number) {
		return withAuth(async () => {
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
		}, ['dashboard', 'student']);
	}
}

export const registrationRequestsService = serviceWrapper(
	RegistrationRequestService,
	'RegistrationRequestsService'
);
