'use server';

import { and, eq, type SQL } from 'drizzle-orm';
import { studentStatuses } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import type {
	StudentStatusEditableInput,
	StudentStatusInsert,
} from '../_lib/types';
import { studentStatusesService } from './service';

export async function getStudentStatus(id: string) {
	return studentStatusesService.get(id);
}

interface StudentStatusFilter {
	type?: (typeof studentStatuses.type.enumValues)[number];
	status?: (typeof studentStatuses.status.enumValues)[number];
}

export async function findAllStudentStatuses(
	page: number,
	search: string,
	filter?: StudentStatusFilter
) {
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

export async function getStudentStatusesByStdNo(stdNo: number) {
	return studentStatusesService.getByStdNo(stdNo);
}

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

export async function getPendingApprovals(page: number, search: string) {
	return studentStatusesService.getPendingForApproval({ page, search });
}

export async function countPendingStudentStatuses() {
	return studentStatusesService.countPendingForCurrentUser();
}
