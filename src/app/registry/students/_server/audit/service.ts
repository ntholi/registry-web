import type { Session } from '@/core/auth';
import withPermission from '@/core/platform/withPermission';
import { studentAuditRepository as repository } from './repository';

class StudentAuditService {
	async getHistory(stdNo: number, page: number, tableFilter?: string) {
		return withPermission(async (session) => {
			const role = this.resolveRoleFilter(session);
			return repository.getStudentHistory({
				stdNo,
				role,
				page,
				tableFilter,
			});
		}, 'dashboard');
	}

	async getSummary(stdNo: number) {
		return withPermission(
			async () => {
				return repository.getStudentHistorySummary(stdNo);
			},
			async (session) => session?.user?.role === 'admin'
		);
	}

	async getTableSummary(stdNo: number) {
		return withPermission(async (session) => {
			const role = this.resolveRoleFilter(session);
			return repository.getStudentHistoryTableSummary(stdNo, role);
		}, 'dashboard');
	}

	private resolveRoleFilter(session?: Session | null): string | undefined {
		const role = session?.user?.role;
		if (role === 'admin') return undefined;
		return role ?? undefined;
	}
}

export const studentAuditService = new StudentAuditService();
