'use server';

import type { autoApprovals, DashboardUser } from '@/core/database';
import { autoApprovalsService as service } from './service';

type AutoApproval = typeof autoApprovals.$inferInsert;

export async function getAutoApproval(id: number) {
	return service.get(id);
}

export async function findAllAutoApprovals(page = 1, search = '') {
	return service.findAll({ page, search });
}

export async function createAutoApproval(data: AutoApproval) {
	return service.create(data);
}

export async function updateAutoApproval(
	id: number,
	data: Partial<AutoApproval>
) {
	return service.update(id, data);
}

export async function deleteAutoApproval(id: number) {
	return service.delete(id);
}

export async function findMatchingAutoApprovals(stdNo: number, termId: number) {
	return service.findMatchingRules(stdNo, termId);
}

export async function bulkCreateAutoApprovals(
	rules: { stdNo: number; termCode: string }[],
	department?: DashboardUser
) {
	return service.bulkCreate(rules, department);
}
