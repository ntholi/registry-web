'use server';

import { and, eq, type SQL } from 'drizzle-orm';
import { studentStatuses } from '@/core/database';
import type { StudentStatusInsert } from '../_lib/types';
import { studentStatusesService } from './service';

export async function getStudentStatus(id: number) {
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

	return studentStatusesService.getAll({
		page,
		search,
		filter: conditions.length > 0 ? and(...conditions) : undefined,
	});
}

export async function getStudentStatusesByStdNo(stdNo: number) {
	return studentStatusesService.getByStdNo(stdNo);
}

export async function createStudentStatus(data: StudentStatusInsert) {
	const result = await studentStatusesService.create(data);
	if (!result) throw new Error('Failed to create application');
	return { id: result.id };
}

export async function cancelStudentStatus(id: number) {
	return studentStatusesService.cancel(id);
}

export async function approveStudentStatusStep(approvalId: number) {
	return studentStatusesService.approve(approvalId);
}

export async function rejectStudentStatusStep(
	approvalId: number,
	message?: string
) {
	return studentStatusesService.reject(approvalId, message);
}

export async function getPendingApprovals(page: number, search: string) {
	return studentStatusesService.getPendingForApproval({ page, search });
}

export async function countPendingStudentStatuses() {
	return studentStatusesService.countPendingForCurrentUser();
}
