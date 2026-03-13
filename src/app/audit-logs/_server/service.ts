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
			['admin', 'registry']
		);
	}

	async get(id: bigint) {
		return withPermission(
			async () => this.repository.getById(id),
			['admin', 'registry']
		);
	}

	async getRecordHistory(tableName: string, recordId: string) {
		return withPermission(
			async () => this.repository.findByRecord(tableName, recordId),
			['admin', 'registry']
		);
	}

	async getDistinctTables() {
		return withPermission(
			async () => this.repository.findDistinctTables(),
			['admin', 'registry']
		);
	}

	async getUnsynced() {
		return withPermission(
			async () => this.repository.findUnsynced(),
			['admin', 'registry']
		);
	}

	async markAsSynced(id: bigint) {
		return withPermission(
			async () => this.repository.markAsSynced(id),
			['admin', 'registry']
		);
	}

	async getStudentModuleAuditHistory(studentModuleId: number) {
		return withPermission(
			async () => this.repository.findByStudentModule(studentModuleId),
			['admin', 'registry', 'academic']
		);
	}
}

export const auditLogService = serviceWrapper(
	AuditLogService,
	'AuditLogService'
);
