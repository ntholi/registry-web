import { getRecordHistory } from '@/app/audit-logs/_server/actions';
import { studentsRepository } from '@/app/registry/students/_server/repository';
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

			const processedUpdates = {
				...updates,
				dateOfBirth: updates.dateOfBirth
					? new Date(updates.dateOfBirth)
					: updates.dateOfBirth,
			};

			return studentsRepository.update(stdNo, processedUpdates, {
				userId: session.user.id,
				metadata: reasons ? { reasons } : undefined,
			});
		}, ['registry', 'admin']);
	}

	async getHistoryByStudentId(stdNo: number) {
		return withAuth(async () => {
			return getRecordHistory('students', String(stdNo));
		}, ['registry', 'admin']);
	}
}

export const studentAuditLogService = serviceWrapper(
	StudentAuditLogService,
	'StudentAuditLogService'
);
