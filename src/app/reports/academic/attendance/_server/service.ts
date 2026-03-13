import withPermission from '@/core/platform/withPermission';
import {
	type AttendanceReportFilter,
	attendanceReportRepository,
} from './repository';

class AttendanceReportService {
	async getSemesterModulesForFilter(
		programId?: number,
		semesterNumber?: string
	) {
		return withPermission(
			async () => {
				return attendanceReportRepository.getSemesterModulesForFilter(
					programId,
					semesterNumber
				);
			},
			{ 'reports-attendance': ['read'] }
		);
	}

	async getAttendanceReportData(filter: AttendanceReportFilter) {
		return withPermission(
			async () => {
				return attendanceReportRepository.getAttendanceReportData(filter);
			},
			{ 'reports-attendance': ['read'] }
		);
	}

	async getPaginatedStudentsWithModuleAttendance(
		filter: AttendanceReportFilter,
		page: number,
		pageSize: number,
		search?: string
	) {
		return withPermission(
			async () => {
				return attendanceReportRepository.getPaginatedStudentsWithModuleAttendance(
					filter,
					page,
					pageSize,
					search
				);
			},
			{ 'reports-attendance': ['read'] }
		);
	}
}

export const attendanceReportService = new AttendanceReportService();
