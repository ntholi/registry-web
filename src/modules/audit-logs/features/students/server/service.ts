import type { studentAuditLogs } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import StudentAuditLogRepository from './repository';

class StudentAuditLogService extends BaseService<
	typeof studentAuditLogs,
	'id'
> {
	constructor() {
		super(new StudentAuditLogRepository(), {
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
		});
	}
}

export const studentAuditLogService = serviceWrapper(
	StudentAuditLogService,
	'StudentAuditLogService'
);
