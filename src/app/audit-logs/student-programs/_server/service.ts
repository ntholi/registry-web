import { auth } from '@/core/auth';
import type { studentProgramAuditLogs } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StudentProgramAuditRepository, {
	type StudentProgramUpdate,
} from './repository';

class StudentProgramAuditService extends BaseService<
	typeof studentProgramAuditLogs,
	'id'
> {
	protected declare repository: StudentProgramAuditRepository;

	constructor() {
		const repository = new StudentProgramAuditRepository();
		super(repository, {
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
		});
	}

	async updateStudentProgram(
		studentProgramId: number,
		updates: StudentProgramUpdate,
		reasons?: string
	) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.id) {
				throw new Error('User not authenticated');
			}

			return this.repository.updateStudentProgramWithAudit(
				studentProgramId,
				updates,
				session.user.id,
				reasons
			);
		}, ['registry', 'admin']);
	}

	async getHistoryByStudentProgramId(studentProgramId: number) {
		return withAuth(async () => {
			return this.repository.findByStudentProgramIdWithUser(studentProgramId);
		}, ['registry', 'admin']);
	}
}

export const studentProgramAuditService = serviceWrapper(
	StudentProgramAuditService,
	'StudentProgramAuditService'
);
