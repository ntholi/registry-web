'use server';

import { auth } from '@/core/auth';
import type { AttendanceStatus } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
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

export const markAttendance = createAction(
	async (
		semesterModuleId: number,
		termId: number,
		weekNumber: number,
		assignedModuleId: number,
		records: { stdNo: number; status: AttendanceStatus }[]
	) => {
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
);

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

export const deleteAttendanceForWeek = createAction(
	async (semesterModuleId: number, termId: number, weekNumber: number) => {
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
);

export async function exportAttendanceForm(input: {
	semesterModuleId: number;
	termId: number;
	moduleCode: string;
	moduleName: string;
	className: string;
}) {
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
	return {
		base64Data: Buffer.from(result.buffer).toString('base64'),
		fileName: `attendance-${input.moduleCode}-${input.className}-${result.termCode}.xlsx`,
	};
}
