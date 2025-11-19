import type { studentModuleAuditLogs } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import StudentModuleAuditLogRepository from './repository';

class StudentModuleAuditLogService extends BaseService<
	typeof studentModuleAuditLogs,
	'id'
> {
	constructor() {
		super(new StudentModuleAuditLogRepository(), {
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
		});
	}
}

export const studentModuleAuditLogService = serviceWrapper(
	StudentModuleAuditLogService,
	'StudentModuleAuditLogService'
);
