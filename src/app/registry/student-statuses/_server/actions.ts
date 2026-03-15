'use server';

import { and, eq, type SQL } from 'drizzle-orm';
import { studentStatuses } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import type {
	StudentStatusEditableInput,
	StudentStatusInsert,
} from '../_lib/types';
import { studentStatusesService } from './service';

export const getStudentStatus = createAction(async (id: string) => {
	return studentStatusesService.get(id);
});

interface StudentStatusFilter {
	type?: (typeof studentStatuses.type.enumValues)[number];
	status?: (typeof studentStatuses.status.enumValues)[number];
}

export const findAllStudentStatuses = createAction(
	async (page: number, search: string, filter?: StudentStatusFilter) => {
		const conditions: SQL[] = [];
		if (filter?.type) conditions.push(eq(studentStatuses.type, filter.type));
		if (filter?.status)
			conditions.push(eq(studentStatuses.status, filter.status));

		return studentStatusesService.queryAll({
			page,
			search,
			filter: conditions.length > 0 ? and(...conditions) : undefined,
		});
	}
);

export const getStudentStatusesByStdNo = createAction(async (stdNo: number) => {
	return studentStatusesService.getByStdNo(stdNo);
});

export const createStudentStatus = createAction(
	async (data: StudentStatusInsert) => {
		const result = await studentStatusesService.createStatus(data);
		if (!result) throw new Error('Failed to create application');
		return { id: result.id };
	}
);

export const updateStudentStatus = createAction(
	async (id: string, data: StudentStatusEditableInput) => {
		const result = await studentStatusesService.edit(id, data);
		if (!result) throw new Error('Failed to update application');
		return { id: result.id };
	}
);

export const cancelStudentStatus = createAction(async (id: string) => {
	return studentStatusesService.cancel(id);
});

export const respondToStudentStatusStep = createAction(
	async (
		approvalId: string,
		status: 'pending' | 'approved' | 'rejected',
		comments?: string
	) => {
		return studentStatusesService.respond(approvalId, status, comments);
	}
);

export const getPendingApprovals = createAction(
	async (page: number, search: string) => {
		return studentStatusesService.getPendingForApproval({ page, search });
	}
);

export const countPendingStudentStatuses = createAction(async () => {
	return studentStatusesService.countPendingForCurrentUser();
});
