'use server';

import { auth } from '@/core/auth';
import type { DashboardRole } from '@/core/auth/permissions';
import type { clearance } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { graduationClearanceService as service } from './service';

type Clearance = typeof clearance.$inferInsert;

export const getGraduationClearance = createAction(async (id: number) =>
	service.get(id)
);

export const countPendingGraduationClearances = createAction(async () =>
	service.countByStatus('pending')
);

export const graduationClearanceByStatus = createAction(
	async (
		status?: 'pending' | 'approved' | 'rejected',
		page: number = 1,
		search: string = '',
		graduationDateId?: number
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
			{ page, search },
			status,
			graduationDateId
		);
		return {
			items: res.items,
			totalPages: res.totalPages,
			totalItems: res.totalItems,
		};
	}
);

export const updateGraduationClearance = createAction(
	async (id: number, data: Clearance, stdNo?: number) =>
		service.update(id, data, stdNo)
);

export const getGraduationClearanceHistoryByStudentNo = createAction(
	async (stdNo: number) => service.getHistoryByStudentNo(stdNo)
);
