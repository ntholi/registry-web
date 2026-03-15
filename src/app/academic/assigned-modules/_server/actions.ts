'use server';

import { getActiveTerm } from '@/app/registry/terms';
import { auth } from '@/core/auth';
import { createAction } from '@/shared/lib/utils/actionResult';
import { assignedModulesService as service } from './service';

export const getAssignedModuleByUserAndModule = createAction(
	async (moduleId: number) => {
		const session = await auth();
		if (!session?.user?.id) {
			return [];
		}
		return service.getByUserAndModule(session.user.id, moduleId);
	}
);

export const deleteAssignedModule = createAction(async (id: number) =>
	service.delete(id)
);

export const assignModulesToLecturer = createAction(
	async (userId: string, semesterModuleIds: number[]) =>
		service.assignModulesToLecturer(userId, semesterModuleIds)
);

export const getLecturersByModule = createAction(async (moduleId: number) =>
	service.getLecturersByModule(moduleId)
);

export const getAssignedModulesByUser = createAction(async (userId: string) => {
	const termId = await getActiveTerm();
	return service.getByUser(userId, termId.id);
});

export const getAssignedModulesByCurrentUser = createAction(async () => {
	const session = await auth();
	if (!session?.user?.id) {
		return [];
	}
	const termId = await getActiveTerm();
	return service.getByUserGroupedByModule(session.user.id, termId.id);
});

export const getAllAssignedModulesByCurrentUser = createAction(async () => {
	const session = await auth();
	if (!session?.user?.id) {
		return [];
	}
	const termId = await getActiveTerm();
	return service.getByUser(session.user.id, termId.id);
});

export const getAssignedModuleByLmsCourseId = createAction(
	async (lmsCourseId: string) => service.getByLmsCourseId(lmsCourseId)
);

export const linkCourseToAssignment = createAction(
	async (userId: string, semesterModuleId: number, lmsCourseId: string) =>
		service.linkCourseToAssignment(userId, semesterModuleId, lmsCourseId)
);
