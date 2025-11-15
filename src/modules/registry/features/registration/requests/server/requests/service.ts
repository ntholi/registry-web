import type { AcademicRemarks, Student } from '@registry/students';
import { getCurrentTerm } from '@registry/terms';
import {
	dashboardUsers,
	type registrationRequests,
	type requestedModules,
	type StudentModuleStatus,
} from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import RegistrationRequestRepository from './repository';

type RegistrationRequest = typeof registrationRequests.$inferInsert;
type RequestedModule = typeof requestedModules.$inferInsert;

class RegistrationRequestService {
	constructor(
		private readonly repository = new RegistrationRequestRepository()
	) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), ['registry']);
	}

	async getByStdNo(stdNo: number, termId: number) {
		return withAuth(
			async () => this.repository.findByStdNo(stdNo, termId),
			async (session) => session.user?.stdNo === stdNo
		);
	}

	async getRequestedModules(registrationRequestId: number) {
		return withAuth(
			async () => this.repository.getRequestedModules(registrationRequestId),
			['student']
		);
	}

	async getHistory(stdNo: number) {
		return withAuth(
			async () => this.repository.getHistory(stdNo),
			['dashboard', 'student']
		);
	}

	async findByStatus(
		status: 'pending' | 'registered' | 'rejected' | 'approved',
		params: QueryOptions<typeof registrationRequests>,
		termId?: number
	) {
		return withAuth(
			async () => this.repository.findByStatus(status, params, termId),
			['registry', 'finance', 'library']
		);
	}

	async countByStatus(
		status: 'pending' | 'registered' | 'rejected' | 'approved'
	) {
		const term = await getCurrentTerm();
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

	async findAll(params: QueryOptions<typeof registrationRequests>) {
		return withAuth(async () => this.repository.query(params), ['registry']);
	}

	async create(data: RegistrationRequest) {
		return withAuth(
			async () => {
				return this.repository.create(data);
			},
			async (session) => session.user?.stdNo === data.stdNo
		);
	}

	async createRequestedModules(stdNo: number, modules: RequestedModule[]) {
		return withAuth(
			async () => this.repository.createRequestedModules(modules),
			async (session) => session.user?.stdNo === stdNo
		);
	}

	async update(id: number, data: Partial<RegistrationRequest>) {
		return withAuth(
			async () => this.repository.update(id, data),
			['student', 'registry']
		);
	}

	async delete(id: number) {
		return withAuth(async () => this.repository.delete(id), []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}

	async createRegistrationWithModules(data: {
		stdNo: number;
		termId: number;
		modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
		sponsorId: number;
		semesterStatus: 'Active' | 'Repeat';
		semesterNumber: string;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
	}) {
		return withAuth(
			async () => {
				return this.repository.createRegistrationWithModules(data);
			},
			async (session) =>
				session.user?.stdNo === data.stdNo || session.user?.role === 'registry'
		);
	}

	async updateRegistrationWithModules(
		registrationRequestId: number,
		modules: { id: number; status: StudentModuleStatus }[],
		semesterNumber?: string,
		semesterStatus?: 'Active' | 'Repeat',
		termId?: number
	) {
		return withAuth(async () => {
			return this.repository.updateRegistrationWithModules(
				registrationRequestId,
				modules,
				semesterNumber,
				semesterStatus,
				termId
			);
		}, ['student', 'registry']);
	}

	async updateRegistrationWithModulesAndSponsorship(
		registrationRequestId: number,
		modules: { id: number; status: StudentModuleStatus }[],
		sponsorshipData: {
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
			return this.repository.updateRegistrationWithModulesAndSponsorship(
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
			const { getStudentSemesterModulesLogic } = await import(
				'./getStudentSemesterModules'
			);
			return getStudentSemesterModulesLogic(student, remarks);
		}, ['student', 'registry']);
	}
}

export const registrationRequestsService = serviceWrapper(
	RegistrationRequestService,
	'RegistrationRequestsService'
);
