import type { studentSemesterSyncRecords } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import StudentSemesterSyncRepository from './repository';

class StudentSemesterSyncService extends BaseService<typeof studentSemesterSyncRecords, 'id'> {
	constructor() {
		super(new StudentSemesterSyncRepository(), {
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
		});
	}
}

export const studentSemesterSyncService = serviceWrapper(
	StudentSemesterSyncService,
	'StudentSemesterSyncService'
);
