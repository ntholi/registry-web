'use server';

import type { DashboardRole } from '@/core/auth/permissions';
import type { autoApprovals } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { autoApprovalsService as service } from './service';

type AutoApproval = typeof autoApprovals.$inferInsert;

export const getAutoApproval = createAction(async (id: number) => {
	return service.get(id);
});

export const findAllAutoApprovals = createAction(
	async (page = 1, search = '') => {
		return service.findAll({ page, search });
	}
);

export const createAutoApproval = createAction(async (data: AutoApproval) => {
	return service.create(data);
});

export const updateAutoApproval = createAction(
	async (id: number, data: Partial<AutoApproval>) => {
		return service.update(id, data);
	}
);

export const deleteAutoApproval = createAction(async (id: number) => {
	return service.delete(id);
});

export const findMatchingAutoApprovals = createAction(
	async (stdNo: number, termId: number) => {
		return service.findMatchingRules(stdNo, termId);
	}
);

export const bulkCreateAutoApprovals = createAction(
	async (
		rules: { stdNo: number; termCode: string }[],
		department?: DashboardRole
	) => {
		return service.bulkCreate(rules, department);
	}
);
