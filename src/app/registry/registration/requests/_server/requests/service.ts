import type { AcademicRemarks, Student } from '@registry/students';
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

	async findAll(
		params: QueryOptions<typeof registrationRequests>,
		termId?: number
	) {
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

				const allowedRoles = ['admin', 'registry', 'student'];
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
		return withAuth(async () => this.repository.delete(id), []);
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

		if (repeatModules.length > repeatReceipts.length) {
			throw new Error(
				`You have selected ${repeatModules.length} repeat modules but only provided ${repeatReceipts.length} receipt(s). Each repeat module requires its own receipt.`
			);
		}

		return withAuth(
			async () => {
				return this.repository.createWithModules(data);
			},
			async (session) =>
				session.user?.stdNo === data.stdNo || session.user?.role === 'registry'
		);
	}

	async updateWithModules(
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
		return withAuth(async () => {
			return this.repository.updateWithModules(
				registrationRequestId,
				modules,
				sponsorshipData,
				semesterNumber,
				semesterStatus,
				termId
			);
		}, ['student', 'registry']);
	}

	async getStudentSemesterModules(student: Student, remarks: AcademicRemarks) {
		return withAuth(async () => {
			return getStudentSemesterModulesLogic(student, remarks);
		}, ['student', 'registry']);
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
