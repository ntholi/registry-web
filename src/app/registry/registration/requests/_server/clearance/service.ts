import { getActiveTerm } from '@/app/registry/terms';
import { auth } from '@/core/auth';
import type { clearance, DashboardUser } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import ClearanceRepository, { type ClearanceFilterOptions } from './repository';

export { getActiveTerm };

type Clearance = typeof clearance.$inferInsert;

class ClearanceService {
	constructor(private readonly repository = new ClearanceRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: number) {
		return withAuth(async () => {
			const result = await this.repository.findByIdWithRelations(id);
			if (!result) return null;
			const activeProgram = result.registrationRequest?.student.programs[0];
			return {
				...result,
				programName: activeProgram?.structure.program.name,
			};
		}, ['dashboard']);
	}

	async countByStatus(status: 'pending' | 'approved' | 'rejected') {
		const term = await getActiveTerm();
		const session = await auth();
		if (!session?.user?.role) return 0;

		return this.repository.countByStatus(
			status,
			session.user.role as DashboardUser,
			term.id
		);
	}

	async findByDepartment(
		department: DashboardUser,
		params: QueryOptions<typeof clearance>,
		status?: 'pending' | 'approved' | 'rejected',
		filter?: ClearanceFilterOptions
	) {
		return withAuth(async () => {
			const effectiveFilter = { ...filter };
			if (!effectiveFilter.termId) {
				const activeTerm = await getActiveTerm();
				effectiveFilter.termId = activeTerm.id;
			}
			return this.repository.findByDepartment(
				department,
				params,
				status,
				effectiveFilter
			);
		}, ['dashboard']);
	}

	async respond(data: Clearance) {
		return withAuth(
			async (session) => {
				if (!data.id) throw Error('Clearance id cannot be null/undefined');
				return this.repository.update(data.id, {
					...data,
					responseDate: new Date(),
					respondedBy: session?.user?.id,
				});
			},
			['dashboard']
		);
	}

	async update(id: number, data: Clearance) {
		return withAuth(
			async (session) => {
				const current = await this.repository.findById(id);
				if (!current) throw new Error('Clearance not found');

				const shouldSetResponseTracking =
					data.status &&
					data.status !== current.status &&
					!current.responseDate;

				if (shouldSetResponseTracking) {
					return this.repository.update(id, {
						...data,
						responseDate: new Date(),
						respondedBy: session?.user?.id,
					});
				}

				return this.repository.update(id, data);
			},
			['dashboard']
		);
	}

	async delete(id: number) {
		return withAuth(async () => this.repository.delete(id), []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}

	async getHistory(clearanceId: number) {
		return withAuth(
			async () => this.repository.findHistory(clearanceId),
			['dashboard']
		);
	}

	async getHistoryByStudentNo(stdNo: number) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.role) throw new Error('Unauthorized');

			return this.repository.findHistoryByStudentNo(
				stdNo,
				session.user.role as DashboardUser
			);
		}, ['dashboard']);
	}

	async findNextPending(department: DashboardUser) {
		return withAuth(
			async () => this.repository.findNextPending(department),
			['dashboard']
		);
	}

	async findByStatusForExport(
		status: 'pending' | 'approved' | 'rejected',
		termId?: number
	) {
		return withAuth(
			async () => this.repository.findByStatusForExport(status, termId),
			['dashboard']
		);
	}
}

export const clearanceService = serviceWrapper(
	ClearanceService,
	'ClearanceService'
);
