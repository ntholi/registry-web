'use server';

import type { ProgramLevel } from '@academic/_database';
import { triggerClearanceEmail } from '@mail/_server/trigger-service';
import { auth } from '@/core/auth';
import type { DashboardRole } from '@/core/auth/permissions';
import type { clearance } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { clearanceService as service } from './service';

type Clearance = typeof clearance.$inferInsert;

export interface ClearanceFilter {
	termId?: number;
	schoolId?: number;
	programId?: number;
	programLevel?: ProgramLevel;
	semester?: string;
}

export async function getClearance(id: number) {
	return service.get(id);
}

export async function countPendingClearances() {
	return service.countByStatus('pending');
}

export async function clearanceByStatus(
	status?: 'pending' | 'approved' | 'rejected',
	page: number = 1,
	search = '',
	filter?: ClearanceFilter
) {
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

export const updateClearance = createAction(
	async (id: number, clearanceData: Clearance, stdNo?: number) => {
		const result = await service.update(id, clearanceData, stdNo);

		if (
			stdNo &&
			clearanceData.status &&
			(clearanceData.status === 'approved' ||
				clearanceData.status === 'rejected')
		) {
			const full = await service.get(id);
			const studentName =
				full?.registrationRequest?.student?.name ?? `Student ${stdNo}`;

			void triggerClearanceEmail({
				clearanceId: id,
				stdNo,
				studentName,
				department: clearanceData.department ?? 'Unknown',
				approved: clearanceData.status === 'approved',
				clearanceType: 'registration',
				reason: clearanceData.message ?? undefined,
			}).catch(() => {});
		}

		return result;
	}
);

export async function getClearanceHistoryByStudentNo(stdNo: number) {
	return service.getHistoryByStudentNo(stdNo);
}
