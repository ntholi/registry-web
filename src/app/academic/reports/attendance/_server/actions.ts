'use server';

import type { AttendanceReportFilter } from './repository';
import { attendanceReportService } from './service';

export async function getAttendanceReportData(filter: AttendanceReportFilter) {
	try {
		const data = await attendanceReportService.getAttendanceReportData(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching attendance report data:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getPaginatedStudentsWithModuleAttendance(
	filter: AttendanceReportFilter,
	page: number,
	pageSize: number,
	search?: string
) {
	try {
		const data =
			await attendanceReportService.getPaginatedStudentsWithModuleAttendance(
				filter,
				page,
				pageSize,
				search
			);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching paginated students:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
