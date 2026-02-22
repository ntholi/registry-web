import withAuth from '@/core/platform/withAuth';
import {
	type AttendanceReportFilter,
	attendanceReportRepository,
} from './repository';

class AttendanceReportService {
	async getSemesterModulesForFilter(
		programId?: number,
		semesterNumber?: string
	) {
		return withAuth(async () => {
			return attendanceReportRepository.getSemesterModulesForFilter(
				programId,
				semesterNumber
			);
		}, ['academic', 'registry', 'leap']);
	}

	async getAttendanceReportData(filter: AttendanceReportFilter) {
		return withAuth(async () => {
			return attendanceReportRepository.getAttendanceReportData(filter);
		}, ['academic', 'registry', 'leap']);
	}

	async getPaginatedStudentsWithModuleAttendance(
		filter: AttendanceReportFilter,
		page: number,
		pageSize: number,
		search?: string
	) {
		return withAuth(async () => {
			return attendanceReportRepository.getPaginatedStudentsWithModuleAttendance(
				filter,
				page,
				pageSize,
				search
			);
		}, ['academic', 'registry', 'leap']);
	}
}

export const attendanceReportService = new AttendanceReportService();
