'use server';

import { auth } from '@/core/auth';
import type { AttendanceStatus } from '@/core/database';
import { attendanceService } from './service';

export async function getWeeksForTerm(termId: number) {
	return attendanceService.getWeeksForTerm(termId);
}

export async function getStudentsForModule(semesterModuleId: number) {
	return attendanceService.getStudentsForModule(semesterModuleId);
}

export async function getAttendanceForWeek(
	semesterModuleId: number,
	termId: number,
	weekNumber: number
) {
	return attendanceService.getAttendanceForWeek(
		semesterModuleId,
		termId,
		weekNumber
	);
}

export async function markAttendance(
	semesterModuleId: number,
	termId: number,
	weekNumber: number,
	assignedModuleId: number,
	records: { stdNo: number; status: AttendanceStatus }[]
) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}
	return attendanceService.markAttendance(
		semesterModuleId,
		termId,
		weekNumber,
		assignedModuleId,
		session.user.id,
		records
	);
}

export async function getAttendanceSummary(
	semesterModuleId: number,
	termId: number
) {
	return attendanceService.getAttendanceSummary(semesterModuleId, termId);
}

export async function getAssignedModulesForCurrentUser() {
	const session = await auth();
	if (!session?.user?.id) {
		return [];
	}
	return attendanceService.getAssignedModulesForCurrentUser(session.user.id);
}

export async function deleteAttendanceForWeek(
	semesterModuleId: number,
	termId: number,
	weekNumber: number
) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}
	return attendanceService.deleteAttendanceForWeek(
		semesterModuleId,
		termId,
		weekNumber
	);
}
