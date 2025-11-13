'use server';

import { auth } from '@/core/auth';
import type { clearance, DashboardUser } from '@/core/db/schema';
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

export async function clearanceByDepartment(page: number = 1, search = '') {
	const session = await auth();
	if (!session?.user?.role) {
		return {
			data: [],
			pages: 0,
		};
	}

	return service.findByDepartment(
		session.user.role as DashboardUser,
		{
			page,
			search,
		},
		'pending'
	);
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

export async function createClearance(clearanceData: Clearance) {
	return service.respond(clearanceData);
}

export async function updateClearance(id: number, clearanceData: Clearance) {
	return service.update(id, clearanceData);
}

export async function deleteClearance(id: number) {
	return service.delete(id);
}

export async function getClearanceHistory(clearanceId: number) {
	return service.getHistory(clearanceId);
}

export async function getClearanceHistoryByStudentNo(stdNo: number) {
	return service.getHistoryByStudentNo(stdNo);
}

export async function getNextPendingClearance() {
	const session = await auth();
	if (!session?.user?.role) {
		return null;
	}

	return service.findNextPending(session.user.role as DashboardUser);
}

export async function exportClearancesByStatus(
	status: 'pending' | 'approved' | 'rejected',
	termId?: number
) {
	const clearances = await service.findByStatusForExport(status, termId);

	const csvData = clearances.map((clearance) => {
		const student = clearance.registrationRequest?.student;
		const activeProgram = student?.programs[0];

		return {
			'Student Number': student?.stdNo || 'N/A',
			'Student Name': student?.name || 'N/A',
			Program: activeProgram?.structure.program.name || 'N/A',
			Department: clearance.department,
			Status: clearance.status,
			Term: clearance.registrationRequest?.term.name || 'N/A',
			'Response Date': clearance.responseDate
				? new Date(clearance.responseDate).toLocaleDateString()
				: 'N/A',
			'Responded By': clearance.respondedBy || 'N/A',
			Message: clearance.message || 'N/A',
			'Created Date': clearance.createdAt
				? new Date(clearance.createdAt).toLocaleDateString()
				: 'N/A',
		};
	});

	const headers = Object.keys(csvData[0] || {});
	const csvContent = [
		headers.join(','),
		...csvData.map((row) =>
			headers
				.map((header) => {
					const value = row[header as keyof typeof row];
					return `"${String(value).replace(/"/g, '""')}"`;
				})
				.join(',')
		),
	].join('\n');

	return csvContent;
}
