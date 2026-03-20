import { auth } from '@/core/auth';
import type { DashboardRole } from '@/core/auth/permissions';
import type { clearance } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import GraduationClearanceRepository from './repository';

type Clearance = typeof clearance.$inferInsert;
const adminOnly = async () => false;

class GraduationClearanceService {
	constructor(
		private readonly repository = new GraduationClearanceRepository()
	) {}

	async get(id: number) {
		return withPermission(
			async () => this.repository.findByIdWithRelations(id),
			'dashboard'
		);
	}

	async countByStatus(status: 'pending' | 'approved' | 'rejected') {
		const session = await auth();
		if (!session?.user?.role) return 0;
		return this.repository.countByStatus(
			status,
			session.user.role as DashboardRole
		);
	}

	async findByDepartment(
		department: DashboardRole,
		params: QueryOptions<typeof clearance>,
		status?: 'pending' | 'approved' | 'rejected',
		graduationDateId?: number
	) {
		return withPermission(
			async () =>
				this.repository.findByDepartment(
					department,
					params,
					status,
					graduationDateId
				),
			'dashboard'
		);
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

			const audit = {
				userId: session!.user!.id!,
				role: session!.user!.role!,
				activityType: 'graduation_clearance_decision' as const,
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
					activityType: 'graduation_clearance_decision',
					stdNo,
				}
			);
		}, 'dashboard');
	}

	async delete(id: number) {
		return withPermission(async () => this.repository.delete(id), adminOnly);
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
}

export const graduationClearanceService = serviceWrapper(
	GraduationClearanceService,
	'GraduationClearanceService'
);
