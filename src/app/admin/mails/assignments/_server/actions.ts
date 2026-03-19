'use server';

import { createAction } from '@/shared/lib/actions/actionResult';
import { mailAssignmentService } from './service';

export async function getAssignments(accountId: string) {
	return mailAssignmentService.getAssignments(accountId);
}

export const assignToRole = createAction(
	async (
		accountId: string,
		role: string,
		perms: { canCompose?: boolean; canReply?: boolean }
	) => mailAssignmentService.assignToRole(accountId, role, perms)
);

export const assignToUser = createAction(
	async (
		accountId: string,
		userId: string,
		perms: { canCompose?: boolean; canReply?: boolean }
	) => mailAssignmentService.assignToUser(accountId, userId, perms)
);

export const removeAssignment = createAction(async (assignmentId: number) =>
	mailAssignmentService.removeAssignment(assignmentId)
);
