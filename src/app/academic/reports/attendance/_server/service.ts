import withAuth from '@/core/platform/withAuth';
import {
	type AttendanceReportFilter,
	attendanceReportRepository,
} from './repository';

class AttendanceReportService {
	async getTerms() {
		return withAuth(async () => {
			return attendanceReportRepository.getTerms();
		}, ['academic']);
	}

	async getSemesterModulesForFilter(
		programId?: number,
		semesterNumber?: string
	) {
		return withAuth(async () => {
			return attendanceReportRepository.getSemesterModulesForFilter(
				programId,
				semesterNumber
			);
		}, ['academic']);
	}

	async getAttendanceReportData(filter: AttendanceReportFilter) {
		return withAuth(async () => {
			return attendanceReportRepository.getAttendanceReportData(filter);
		}, ['academic']);
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
		}, ['academic']);
	}
}

export const attendanceReportService = new AttendanceReportService();
