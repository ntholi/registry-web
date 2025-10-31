'use server';

import { auth } from '@/auth';
import type { assignedModules } from '@/db/schema';
import { assignedModulesService as service } from './service';

type AssignedModule = typeof assignedModules.$inferInsert;

export async function getAssignedModule(id: number) {
	return service.get(id);
}

export async function getAssignedModules(page: number = 1, search = '') {
	return service.getAll({ page, search });
}

export async function getAssignedModuleByUserAndModule(moduleId: number) {
	const session = await auth();
	if (!session?.user?.id) {
		return [];
	}
	return service.getByUserAndModule(session.user.id, moduleId);
}

export async function createAssignedModule(assignedModule: AssignedModule) {
	return service.create(assignedModule);
}

export async function updateAssignedModule(id: number, assignedModule: AssignedModule) {
	return service.update(id, assignedModule);
}

export async function deleteAssignedModule(id: number) {
	return service.delete(id);
}

export async function assignModulesToLecturer(userId: string, semesterModuleIds: number[]) {
	return service.assignModulesToLecturer(userId, semesterModuleIds);
}

export async function getLecturersByModule(moduleId: number) {
	return service.getLecturersByModule(moduleId);
}

export async function getAssignedModulesByUser(userId: string) {
	return service.getByUser(userId);
}

export async function getAssignedModulesByCurrentUser() {
	const session = await auth();
	if (!session?.user?.id) {
		return [];
	}
	return service.getByUserGroupedByModule(session.user.id);
}

export async function checkModuleAssignment(userId: string, semesterModuleId: number) {
	return service.checkAssignment(userId, semesterModuleId);
}
