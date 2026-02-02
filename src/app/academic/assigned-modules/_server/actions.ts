'use server';

import { getActiveTerm } from '@/app/registry/terms';
import { auth } from '@/core/auth';
import { assignedModulesService as service } from './service';

export async function getAssignedModuleByUserAndModule(moduleId: number) {
	const session = await auth();
	if (!session?.user?.id) {
		return [];
	}
	return service.getByUserAndModule(session.user.id, moduleId);
}

export async function deleteAssignedModule(id: number) {
	return service.delete(id);
}

export async function assignModulesToLecturer(
	userId: string,
	semesterModuleIds: number[]
) {
	return service.assignModulesToLecturer(userId, semesterModuleIds);
}

export async function getLecturersByModule(moduleId: number) {
	return service.getLecturersByModule(moduleId);
}

export async function getAssignedModulesByUser(userId: string) {
	const termId = await getActiveTerm();
	return service.getByUser(userId, termId.id);
}

export async function getAssignedModulesByCurrentUser() {
	const session = await auth();
	if (!session?.user?.id) {
		return [];
	}
	const termId = await getActiveTerm();
	return service.getByUserGroupedByModule(session.user.id, termId.id);
}

export async function getAssignedModuleByLmsCourseId(lmsCourseId: string) {
	return service.getByLmsCourseId(lmsCourseId);
}

export async function linkCourseToAssignment(
	userId: string,
	semesterModuleId: number,
	lmsCourseId: string
) {
	return service.linkCourseToAssignment(userId, semesterModuleId, lmsCourseId);
}
