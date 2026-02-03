'use server';

import { auth } from '@/core/auth';
import type { AttendanceStatus } from '@/core/database';
import { attendanceService } from './service';

export async function getWeeksForTerm(termId: number) {
	return attendanceService.getWeeksForTerm(termId);
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

export async function exportAttendanceForm(input: {
	semesterModuleId: number;
	termId: number;
	moduleCode: string;
	moduleName: string;
	className: string;
}) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error('Unauthorized');
		}
		const lecturerName = session.user.name ?? session.user.email ?? 'Lecturer';
		const result = await attendanceService.exportAttendanceForm(
			input.semesterModuleId,
			input.termId,
			input.moduleCode,
			input.moduleName,
			input.className,
			lecturerName
		);
		const base64Data = Buffer.from(result.buffer).toString('base64');
		const fileName = `attendance-${input.moduleCode}-${input.className}-${result.termCode}.xlsx`;
		return { success: true, data: base64Data, fileName };
	} catch (error) {
		console.error('Error exporting attendance form:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
