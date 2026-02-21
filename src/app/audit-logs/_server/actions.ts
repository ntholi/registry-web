'use server';

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

export async function markAuditLogSynced(id: bigint) {
	return service.markAsSynced(id);
}

export async function getStudentModuleAuditHistory(studentModuleId: number) {
	return service.getStudentModuleAuditHistory(studentModuleId);
}
