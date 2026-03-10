import type { Session } from 'next-auth';
import withAuth from '@/core/platform/withAuth';
import { studentHistoryRepository as repository } from './repository';

class StudentHistoryService {
	async getHistory(stdNo: number, page: number, tableFilter?: string) {
		return withAuth(
			async (session) => {
				const role = this.resolveRoleFilter(session);
				return repository.getStudentHistory({
					stdNo,
					role,
					page,
					tableFilter,
				});
			},
			['dashboard']
		);
	}

	async getSummary(stdNo: number) {
		return withAuth(async () => {
			return repository.getStudentHistorySummary(stdNo);
		}, ['admin']);
	}

	async getTableSummary(stdNo: number) {
		return withAuth(
			async (session) => {
				const role = this.resolveRoleFilter(session);
				return repository.getStudentHistoryTableSummary(stdNo, role);
			},
			['dashboard']
		);
	}

	private resolveRoleFilter(session?: Session | null): string | undefined {
		const role = session?.user?.role;
		if (role === 'admin') return undefined;
		return role ?? undefined;
	}
}

export const studentHistoryService = new StudentHistoryService();
