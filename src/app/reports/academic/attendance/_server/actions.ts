'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { AttendanceReportFilter } from './repository';
import { attendanceReportService } from './service';

export const getAttendanceReportData = createAction(
	async (filter: AttendanceReportFilter) => {
		return attendanceReportService.getAttendanceReportData(filter);
	}
);

export const getPaginatedStudentsWithModuleAttendance = createAction(
	async (
		filter: AttendanceReportFilter,
		page: number,
		pageSize: number,
		search?: string
	) => {
		return attendanceReportService.getPaginatedStudentsWithModuleAttendance(
			filter,
			page,
			pageSize,
			search
		);
	}
);
