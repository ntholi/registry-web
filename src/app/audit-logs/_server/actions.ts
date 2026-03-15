'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import { auditLogService as service } from './service';

export const getAuditLogs = createAction(
	async (
		page: number,
		search: string,
		tableName?: string,
		operation?: string
	) => {
		return service.findAll(page, search, tableName, operation);
	}
);

export const getRecordHistory = createAction(
	async (tableName: string, recordId: string) => {
		return service.getRecordHistory(tableName, recordId);
	}
);

export const getAuditLog = createAction(async (id: bigint) => {
	return service.get(id);
});

export const getDistinctTables = createAction(async () => {
	return service.getDistinctTables();
});

export const getUnsyncedAuditLogs = createAction(async () => {
	return service.getUnsynced();
});

export const markAuditLogSynced = createAction(async (id: bigint) => {
	return service.markAsSynced(id);
});

export const getStudentModuleAuditHistory = createAction(
	async (studentModuleId: number) => {
		return service.getStudentModuleAuditHistory(studentModuleId);
	}
);
