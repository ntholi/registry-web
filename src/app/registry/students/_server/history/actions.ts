'use server';

import { studentHistoryService as service } from './service';

export async function getStudentHistory(
	stdNo: number,
	page: number,
	tableFilter?: string
) {
	return service.getHistory(stdNo, page, tableFilter);
}

export async function getStudentHistoryTableSummary(stdNo: number) {
	return service.getTableSummary(stdNo);
}
