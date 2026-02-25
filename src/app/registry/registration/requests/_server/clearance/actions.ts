'use server';

import type { ProgramLevel } from '@academic/_database';
import { auth } from '@/core/auth';
import type { clearance, DashboardUser } from '@/core/database';
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
		session.user.role as DashboardUser,
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

export async function updateClearance(
	id: number,
	clearanceData: Clearance,
	stdNo?: number
) {
	return service.update(id, clearanceData, stdNo);
}

export async function getClearanceHistoryByStudentNo(stdNo: number) {
	return service.getHistoryByStudentNo(stdNo);
}
