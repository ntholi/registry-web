'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import { studentAuditService as service } from './service';

export const getStudentHistory = createAction(
	async (stdNo: number, page: number, tableFilter?: string) =>
		service.getHistory(stdNo, page, tableFilter)
);

export const getStudentHistoryTableSummary = createAction(
	async (stdNo: number) => service.getTableSummary(stdNo)
);
