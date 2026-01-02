'use server';

import { auth } from '@/core/auth';
import type { clearance, DashboardUser } from '@/core/database';
import { clearanceService as service } from './service';

type Clearance = typeof clearance.$inferInsert;

export async function getClearance(id: number) {
	return service.get(id);
}

export async function countPendingClearances() {
	return service.countByStatus('pending');
}

export async function countApprovedClearances() {
	return service.countByStatus('approved');
}

export async function countRejectedClearances() {
	return service.countByStatus('rejected');
}

export async function clearanceByStatus(
	status: 'pending' | 'approved' | 'rejected',
	page: number = 1,
	search = '',
	termId?: number
) {
	const session = await auth();
	if (!session?.user?.role) {
		return {
			data: [],
			pages: 0,
		};
	}

	const res = await service.findByDepartment(
		session.user.role as DashboardUser,
		{
			page,
			search,
		},
		status,
		termId
	);

	return {
		items: res.items,
		totalPages: res.totalPages,
	};
}

export async function updateClearance(id: number, clearanceData: Clearance) {
	return service.update(id, clearanceData);
}

export async function getClearanceHistoryByStudentNo(stdNo: number) {
	return service.getHistoryByStudentNo(stdNo);
}
