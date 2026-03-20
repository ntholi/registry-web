import type { RegistryActivityType } from '@registry/_lib/activities';
import { termsService } from '@registry/terms/_server/service';
import { auth } from '@/core/auth';
import type { DashboardRole } from '@/core/auth/permissions';
import type { clearance } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import ClearanceRepository, { type ClearanceFilterOptions } from './repository';

type Clearance = typeof clearance.$inferInsert;
const adminOnly = async () => false;

class ClearanceService {
	constructor(private readonly repository = new ClearanceRepository()) {}

	async first() {
		return withPermission(async () => this.repository.findFirst(), adminOnly);
	}

	async get(id: number) {
		return withPermission(async () => {
			const result = await this.repository.findByIdWithRelations(id);
			if (!result) return null;
			const activeProgram = result.registrationRequest?.student.programs[0];
			return {
				...result,
				programName: activeProgram?.structure.program.name,
			};
		}, 'dashboard');
	}

	async countByStatus(status: 'pending' | 'approved' | 'rejected') {
		const term = await termsService.getActiveOrThrow();
		const session = await auth();
		if (!session?.user?.role) return 0;

		return this.repository.countByStatus(
			status,
			session.user.role as DashboardRole,
			term.id
		);
	}

	async findByDepartment(
		department: DashboardRole,
		params: QueryOptions<typeof clearance>,
		status?: 'pending' | 'approved' | 'rejected',
		filter?: ClearanceFilterOptions
	) {
		return withPermission(async () => {
			const effectiveFilter = { ...filter };
			if (!effectiveFilter.termId) {
				const activeTerm = await termsService.getActiveOrThrow();
				effectiveFilter.termId = activeTerm.id;
			}
			return this.repository.findByDepartment(
				department,
				params,
				status,
				effectiveFilter
			);
		}, 'dashboard');
	}

	async respond(data: Clearance, stdNo?: number) {
		return withPermission(async (session) => {
			if (!data.id) throw Error('Clearance id cannot be null/undefined');
			const current = await this.repository.findById(data.id);
			if (!current) throw new Error('Clearance not found');
			if (
				session?.user?.role !== 'admin' &&
				session?.user?.role !== current.department
			) {
				throw new UserFacingError(
					'You do not have permission to respond to this clearance',
					'FORBIDDEN'
				);
			}
			const activityType: RegistryActivityType =
				data.status === 'rejected'
					? 'clearance_rejected'
					: 'clearance_approved';
			return this.repository.update(
				data.id,
				{
					...data,
					responseDate: new Date(),
					respondedBy: session?.user?.id,
				},
				{
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType,
					stdNo,
				}
			);
		}, 'dashboard');
	}

	async update(id: number, data: Clearance, stdNo?: number) {
		return withPermission(async (session) => {
			const current = await this.repository.findById(id);
			if (!current) throw new Error('Clearance not found');

			if (
				session?.user?.role !== 'admin' &&
				session?.user?.role !== current.department
			) {
				throw new UserFacingError(
					'You do not have permission to update this clearance',
					'FORBIDDEN'
				);
			}

			const activityType: RegistryActivityType =
				data.status === 'rejected'
					? 'clearance_rejected'
					: 'clearance_approved';
			const audit = {
				userId: session!.user!.id!,
				role: session!.user!.role!,
				activityType,
				stdNo,
			};

			const shouldSetResponseTracking =
				data.status && data.status !== current.status && !current.responseDate;

			if (shouldSetResponseTracking) {
				return this.repository.update(
					id,
					{
						...data,
						responseDate: new Date(),
						respondedBy: session?.user?.id,
					},
					audit
				);
			}

			return this.repository.update(id, data, audit);
		}, 'dashboard');
	}

	async delete(id: number) {
		return withPermission(async () => this.repository.delete(id), adminOnly);
	}

	async count() {
		return withPermission(async () => this.repository.count(), adminOnly);
	}

	async getHistory(clearanceId: number) {
		return withPermission(
			async () => this.repository.findHistory(clearanceId),
			'dashboard'
		);
	}

	async getHistoryByStudentNo(stdNo: number) {
		return withPermission(async () => {
			const session = await auth();
			if (!session?.user?.role) throw new Error('Unauthorized');

			return this.repository.findHistoryByStudentNo(
				stdNo,
				session.user.role as DashboardRole
			);
		}, 'dashboard');
	}

	async findNextPending(department: DashboardRole) {
		return withPermission(
			async () => this.repository.findNextPending(department),
			'dashboard'
		);
	}

	async findByStatusForExport(
		status: 'pending' | 'approved' | 'rejected',
		termId?: number
	) {
		return withPermission(
			async () => this.repository.findByStatusForExport(status, termId),
			'dashboard'
		);
	}
}

export const clearanceService = serviceWrapper(
	ClearanceService,
	'ClearanceService'
);
