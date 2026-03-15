'use server';

import type { DashboardRole } from '@/core/auth/permissions';
import type { autoApprovals } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { autoApprovalsService as service } from './service';

type AutoApproval = typeof autoApprovals.$inferInsert;

export const getAutoApproval = createAction(async (id: number) =>
	service.get(id)
);

export const findAllAutoApprovals = createAction(
	async (page: number = 1, search: string = '') =>
		service.findAll({ page, search })
);

export const createAutoApproval = createAction(async (data: AutoApproval) =>
	service.create(data)
);

export const updateAutoApproval = createAction(
	async (id: number, data: Partial<AutoApproval>) => service.update(id, data)
);

export const deleteAutoApproval = createAction(async (id: number) =>
	service.delete(id)
);

export const findMatchingAutoApprovals = createAction(
	async (stdNo: number, termId: number) =>
		service.findMatchingRules(stdNo, termId)
);

export const bulkCreateAutoApprovals = createAction(
	async (
		rules: { stdNo: number; termCode: string }[],
		department?: DashboardRole
	) => service.bulkCreate(rules, department)
);
