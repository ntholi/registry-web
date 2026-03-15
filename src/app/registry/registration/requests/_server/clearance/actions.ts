'use server';

import type { ProgramLevel } from '@academic/_database';
import { auth } from '@/core/auth';
import type { DashboardRole } from '@/core/auth/permissions';
import type { clearance } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { clearanceService as service } from './service';

type Clearance = typeof clearance.$inferInsert;

export interface ClearanceFilter {
	termId?: number;
	schoolId?: number;
	programId?: number;
	programLevel?: ProgramLevel;
	semester?: string;
}

export const getClearance = createAction(async (id: number) => service.get(id));

export const countPendingClearances = createAction(async () =>
	service.countByStatus('pending')
);

export const clearanceByStatus = createAction(
	async (
		status?: 'pending' | 'approved' | 'rejected',
		page: number = 1,
		search: string = '',
		filter?: ClearanceFilter
	) => {
		const session = await auth();
		if (!session?.user?.role) {
			return {
				items: [],
				totalPages: 0,
				totalItems: 0,
			};
		}

		const res = await service.findByDepartment(
			session.user.role as DashboardRole,
			{
				page,
				search,
			},
			status,
			filter
		);

		return {
			items: res.items,
			totalPages: res.totalPages,
			totalItems: res.totalItems,
		};
	}
);

export const updateClearance = createAction(
	async (id: number, clearanceData: Clearance, stdNo?: number) =>
		service.update(id, clearanceData, stdNo)
);

export const getClearanceHistoryByStudentNo = createAction(
	async (stdNo: number) => service.getHistoryByStudentNo(stdNo)
);
