import { auth } from '@/core/auth';
import type { studentSemesterAuditLogs } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StudentSemesterSyncRepository, {
	type StudentSemesterUpdate,
} from './repository';

class StudentSemesterSyncService extends BaseService<
	typeof studentSemesterAuditLogs,
	'id'
> {
	protected declare repository: StudentSemesterSyncRepository;

	constructor() {
		const repository = new StudentSemesterSyncRepository();
		super(repository, {
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
		});
	}

	async updateStudentSemester(
		studentSemesterId: number,
		updates: StudentSemesterUpdate,
		reasons?: string
	) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.id) {
				throw new Error('User not authenticated');
			}

			return this.repository.updateStudentSemesterWithAudit(
				studentSemesterId,
				updates,
				session.user.id,
				reasons
			);
		}, ['registry', 'admin']);
	}

	async getHistoryByStudentSemesterId(studentSemesterId: number) {
		return withAuth(async () => {
			return this.repository.findByStudentSemesterIdWithUser(studentSemesterId);
		}, ['registry', 'admin']);
	}
}

export const studentSemesterSyncService = serviceWrapper(
	StudentSemesterSyncService,
	'StudentSemesterSyncService'
);
