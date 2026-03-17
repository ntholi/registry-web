'use server';

import { createAction } from '@/shared/lib/actions/actionResult';
import { auditLogService as service } from './service';

export async function getAuditLogs(
	page: number,
	search: string,
	tableName?: string,
	operation?: string
) {
	return service.findAll(page, search, tableName, operation);
}

export async function getRecordHistory(tableName: string, recordId: string) {
	return service.getRecordHistory(tableName, recordId);
}

export async function getAuditLog(id: bigint) {
	return service.get(id);
}

export async function getDistinctTables() {
	return service.getDistinctTables();
}

export async function getUnsyncedAuditLogs() {
	return service.getUnsynced();
}

export const markAuditLogSynced = createAction(async (id: bigint) =>
	service.markAsSynced(id)
);

export async function getStudentModuleAuditHistory(studentModuleId: number) {
	return service.getStudentModuleAuditHistory(studentModuleId);
}
