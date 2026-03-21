'use server';

import { triggerStudentStatusEmail } from '@mail/_server/trigger-service';
import { and, eq, type SQL } from 'drizzle-orm';
import { studentStatuses } from '@/core/database';
import { getSession } from '@/core/platform/withPermission';
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

		void triggerStudentStatusEmail({
			stdNo: result.stdNo,
			studentName: result.student?.name ?? '',
			statusId: result.id,
			statusType: result.type,
			action: 'created',
		}).catch(() => {});

		return { id: result.id };
	}
);

export const updateStudentStatus = createAction(
	async (id: string, data: StudentStatusEditableInput) => {
		const result = await studentStatusesService.edit(id, data);
		if (!result) throw new Error('Failed to update application');

		void triggerStudentStatusEmail({
			stdNo: result.stdNo,
			studentName: result.student?.name ?? '',
			statusId: result.id,
			statusType: result.type,
			action: 'updated',
		}).catch(() => {});

		return { id: result.id };
	}
);

export const uploadStudentStatusAttachment = createAction(
	async (id: string, formData: FormData) => {
		const fileValue = formData.get('file');
		if (!(fileValue instanceof File)) {
			throw new Error('File is required');
		}

		return studentStatusesService.uploadAttachment(
			id,
			fileValue,
			fileValue.name,
			fileValue.type
		);
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
		const result = await studentStatusesService.respond(
			approvalId,
			status,
			comments
		);

		if (result && (status === 'approved' || status === 'rejected')) {
			const session = await getSession();
			void triggerStudentStatusEmail({
				stdNo: result.stdNo,
				studentName: result.student?.name ?? '',
				statusId: result.id,
				statusType: result.type,
				action: status,
				reason: comments,
				approverName: session?.user?.name ?? undefined,
			}).catch(() => {});
		}

		return result;
	}
);

export async function getPendingApprovals(page: number, search: string) {
	return studentStatusesService.getPendingForApproval({ page, search });
}

export async function countPendingStudentStatuses() {
	return studentStatusesService.countPendingForCurrentUser();
}
