'use server';

import { triggerClearanceEmail } from '@mail/_server/trigger-service';
import { auth } from '@/core/auth';
import type { DashboardRole } from '@/core/auth/permissions';
import type { clearance } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { graduationClearanceService as service } from './service';

type Clearance = typeof clearance.$inferInsert;

export async function getGraduationClearance(id: number) {
	return service.get(id);
}

export async function countPendingGraduationClearances() {
	return service.countByStatus('pending');
}

export async function graduationClearanceByStatus(
	status?: 'pending' | 'approved' | 'rejected',
	page: number = 1,
	search = '',
	graduationDateId?: number
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

export const updateGraduationClearance = createAction(
	async (id: number, data: Clearance, stdNo?: number) => {
		const result = await service.update(id, data, stdNo);

		if (
			stdNo &&
			data.status &&
			(data.status === 'approved' || data.status === 'rejected')
		) {
			const full = await service.get(id);
			const studentName =
				full?.graduationRequest?.studentProgram?.student?.name ??
				`Student ${stdNo}`;

			void triggerClearanceEmail({
				clearanceId: id,
				stdNo,
				studentName,
				department: data.department ?? 'Unknown',
				approved: data.status === 'approved',
				clearanceType: 'graduation',
				reason: data.message ?? undefined,
			}).catch(() => {});
		}

		return result;
	}
);

export async function getGraduationClearanceHistoryByStudentNo(stdNo: number) {
	return service.getHistoryByStudentNo(stdNo);
}
