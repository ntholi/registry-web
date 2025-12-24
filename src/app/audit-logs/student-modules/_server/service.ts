import { auth } from '@/core/auth';
import type { studentModuleAuditLogs } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StudentModuleAuditLogRepository, {
	type StudentModuleUpdate,
} from './repository';

class StudentModuleAuditLogService extends BaseService<
	typeof studentModuleAuditLogs,
	'id'
> {
	protected declare repository: StudentModuleAuditLogRepository;

	constructor() {
		const repository = new StudentModuleAuditLogRepository();
		super(repository, {
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
		});
	}

	async updateStudentModule(
		studentModuleId: number,
		updates: StudentModuleUpdate,
		reasons?: string
	) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.id) {
				throw new Error('User not authenticated');
			}

			return this.repository.updateStudentModuleWithAudit(
				studentModuleId,
				updates,
				session.user.id,
				reasons
			);
		}, ['registry', 'admin']);
	}

	async getHistoryByStudentModuleId(studentModuleId: number) {
		return withAuth(async () => {
			return this.repository.findByStudentModuleIdWithUser(studentModuleId);
		}, ['registry', 'admin']);
	}
}

export const studentModuleAuditLogService = serviceWrapper(
	StudentModuleAuditLogService,
	'StudentModuleAuditLogService'
);
