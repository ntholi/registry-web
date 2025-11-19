import { auth } from '@/core/auth';
import type { studentAuditLogs } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StudentAuditLogRepository, { type StudentUpdate } from './repository';

class StudentAuditLogService extends BaseService<
	typeof studentAuditLogs,
	'id'
> {
	protected declare repository: StudentAuditLogRepository;

	constructor() {
		const repository = new StudentAuditLogRepository();
		super(repository, {
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
		});
	}

	async updateStudent(stdNo: number, updates: StudentUpdate, reasons?: string) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.id) {
				throw new Error('User not authenticated');
			}

			return this.repository.updateStudentWithAudit(
				stdNo,
				updates,
				session.user.id,
				reasons
			);
		}, ['registry', 'admin']);
	}
}

export const studentAuditLogService = serviceWrapper(
	StudentAuditLogService,
	'StudentAuditLogService'
);
