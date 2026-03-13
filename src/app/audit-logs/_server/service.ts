import { hasPermission } from '@/core/auth/sessionPermissions';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import AuditLogRepository from './repository';

class AuditLogService {
	constructor(private readonly repository = new AuditLogRepository()) {}

	async findAll(
		page: number,
		search: string,
		tableName?: string,
		operation?: string
	) {
		return withPermission(
			async () => this.repository.query({ page, search, tableName, operation }),
			async (session) =>
				hasPermission(session, 'activity-tracker', 'read') ||
				session?.user?.role === 'registry'
		);
	}

	async get(id: bigint) {
		return withPermission(
			async () => this.repository.getById(id),
			async (session) =>
				hasPermission(session, 'activity-tracker', 'read') ||
				session?.user?.role === 'registry'
		);
	}

	async getRecordHistory(tableName: string, recordId: string) {
		return withPermission(
			async () => this.repository.findByRecord(tableName, recordId),
			async (session) =>
				hasPermission(session, 'activity-tracker', 'read') ||
				session?.user?.role === 'registry'
		);
	}

	async getDistinctTables() {
		return withPermission(
			async () => this.repository.findDistinctTables(),
			async (session) =>
				hasPermission(session, 'activity-tracker', 'read') ||
				session?.user?.role === 'registry'
		);
	}

	async getUnsynced() {
		return withPermission(
			async () => this.repository.findUnsynced(),
			async (session) =>
				hasPermission(session, 'activity-tracker', 'read') ||
				session?.user?.role === 'registry'
		);
	}

	async markAsSynced(id: bigint) {
		return withPermission(
			async () => this.repository.markAsSynced(id),
			async (session) =>
				hasPermission(session, 'activity-tracker', 'read') ||
				session?.user?.role === 'registry'
		);
	}

	async getStudentModuleAuditHistory(studentModuleId: number) {
		return withPermission(
			async () => this.repository.findByStudentModule(studentModuleId),
			async (session) =>
				hasPermission(session, 'activity-tracker', 'read') ||
				session?.user?.role === 'registry' ||
				session?.user?.role === 'academic'
		);
	}
}

export const auditLogService = serviceWrapper(
	AuditLogService,
	'AuditLogService'
);
