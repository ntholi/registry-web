import { termsService } from '@registry/terms/_server/service';
import type { AttendanceStatus } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import { createAttendanceExcel } from './excel';
import AttendanceRepository from './repository';

class AttendanceService {
	constructor(private readonly repository = new AttendanceRepository()) {}

	async getWeeksForTerm(termId: number) {
		return withPermission(async () => this.repository.getWeeksForTerm(termId), {
			attendance: ['read'],
		});
	}

	async getStudentsForModule(semesterModuleId: number) {
		return withPermission(
			async () => {
				const term = await termsService.getActiveOrThrow();
				return this.repository.getStudentsForModule(
					semesterModuleId,
					term.code
				);
			},
			{ attendance: ['read'] }
		);
	}

	async getAttendanceForWeek(
		semesterModuleId: number,
		termId: number,
		weekNumber: number
	) {
		return withPermission(
			async () => {
				const term = await termsService.getActiveOrThrow();
				return this.repository.getAttendanceForWeek(
					semesterModuleId,
					termId,
					weekNumber,
					term.code
				);
			},
			{ attendance: ['read'] }
		);
	}

	async markAttendance(
		semesterModuleId: number,
		termId: number,
		weekNumber: number,
		assignedModuleId: number,
		markedBy: string,
		records: { stdNo: number; status: AttendanceStatus }[]
	) {
		return withPermission(
			async (session) => {
				const attendanceRecords = records.map((r) => ({
					stdNo: r.stdNo,
					semesterModuleId,
					termId,
					weekNumber,
					status: r.status,
					assignedModuleId,
					markedBy,
				}));
				return this.repository.upsertAttendance(attendanceRecords, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'attendance_recorded',
				});
			},
			{ attendance: ['create'] }
		);
	}

	async getAttendanceSummary(semesterModuleId: number, termId: number) {
		return withPermission(
			async () => {
				const term = await termsService.getActiveOrThrow();
				return this.repository.getAttendanceSummaryForModule(
					semesterModuleId,
					termId,
					term.code
				);
			},
			{ attendance: ['read'] }
		);
	}

	async getAssignedModulesForCurrentUser(userId: string) {
		const term = await termsService.getActiveOrThrow();
		return withPermission(
			async () =>
				this.repository.getAssignedModulesWithDetails(userId, term.id),
			{ attendance: ['read'] }
		);
	}

	async deleteAttendanceForWeek(
		semesterModuleId: number,
		termId: number,
		weekNumber: number
	) {
		return withPermission(
			async () =>
				this.repository.deleteAttendanceForWeek(
					semesterModuleId,
					termId,
					weekNumber
				),
			{ attendance: ['delete'] }
		);
	}

	async exportAttendanceForm(
		semesterModuleId: number,
		termId: number,
		moduleCode: string,
		moduleName: string,
		className: string,
		lecturerName: string
	) {
		return withPermission(
			async () => {
				const term = await this.repository.getTermInfo(termId);
				if (!term) {
					throw new Error('Term not found');
				}
				const weeks = await this.repository.getWeeksForTerm(termId);
				const summary = await this.repository.getAttendanceSummaryForModule(
					semesterModuleId,
					termId,
					term.code
				);
				const buffer = await createAttendanceExcel({
					moduleCode,
					moduleName,
					className,
					lecturerName,
					termName: term.name ?? term.code,
					termCode: term.code,
					weeks,
					students: summary,
				});
				return { buffer, termCode: term.code };
			},
			{ attendance: ['read'] }
		);
	}
}

export const attendanceService = serviceWrapper(
	AttendanceService,
	'AttendanceService'
);
