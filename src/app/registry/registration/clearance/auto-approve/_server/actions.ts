'use server';

import type { autoApprovalRules, DashboardUser } from '@/core/database';
import { autoApprovalRulesService as service } from './service';

type AutoApprovalRule = typeof autoApprovalRules.$inferInsert;

export async function getAutoApprovalRule(id: number) {
	return service.get(id);
}

export async function findAllAutoApprovalRules(page = 1, search = '') {
	return service.findAll({ page, search });
}

export async function createAutoApprovalRule(data: AutoApprovalRule) {
	return service.create(data);
}

export async function updateAutoApprovalRule(
	id: number,
	data: Partial<AutoApprovalRule>
) {
	return service.update(id, data);
}

export async function deleteAutoApprovalRule(id: number) {
	return service.delete(id);
}

export async function findMatchingAutoApprovalRules(
	stdNo: number,
	termId: number
) {
	return service.findMatchingRules(stdNo, termId);
}

export async function bulkCreateAutoApprovalRules(
	rules: { stdNo: number; termCode: string }[],
	department?: DashboardUser
) {
	return service.bulkCreate(rules, department);
}
