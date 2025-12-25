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
}

export const attendanceReportService = new AttendanceReportService();
