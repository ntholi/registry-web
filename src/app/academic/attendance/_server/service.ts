import { getActiveTerm } from '@/app/registry/terms';
import type { AttendanceStatus } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { createAttendanceExcel } from './excel';
import AttendanceRepository from './repository';

class AttendanceService {
	constructor(private readonly repository = new AttendanceRepository()) {}

	async getWeeksForTerm(termId: number) {
		return withAuth(
			async () => this.repository.getWeeksForTerm(termId),
			['academic', 'leap']
		);
	}

	async getStudentsForModule(semesterModuleId: number) {
		return withAuth(async () => {
			const term = await getActiveTerm();
			return this.repository.getStudentsForModule(semesterModuleId, term.code);
		}, ['academic', 'leap']);
	}

	async getAttendanceForWeek(
		semesterModuleId: number,
		termId: number,
		weekNumber: number
	) {
		return withAuth(async () => {
			const term = await getActiveTerm();
			return this.repository.getAttendanceForWeek(
				semesterModuleId,
				termId,
				weekNumber,
				term.code
			);
		}, ['academic', 'leap']);
	}

	async markAttendance(
		semesterModuleId: number,
		termId: number,
		weekNumber: number,
		assignedModuleId: number,
		markedBy: string,
		records: { stdNo: number; status: AttendanceStatus }[]
	) {
		return withAuth(
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
				});
			},
			['academic', 'leap']
		);
	}

	async getAttendanceSummary(semesterModuleId: number, termId: number) {
		return withAuth(async () => {
			const term = await getActiveTerm();
			return this.repository.getAttendanceSummaryForModule(
				semesterModuleId,
				termId,
				term.code
			);
		}, ['academic', 'leap']);
	}

	async getAssignedModulesForCurrentUser(userId: string) {
		const term = await getActiveTerm();
		return withAuth(
			async () =>
				this.repository.getAssignedModulesWithDetails(userId, term.id),
			['academic', 'leap']
		);
	}

	async deleteAttendanceForWeek(
		semesterModuleId: number,
		termId: number,
		weekNumber: number
	) {
		return withAuth(
			async () =>
				this.repository.deleteAttendanceForWeek(
					semesterModuleId,
					termId,
					weekNumber
				),
			['academic', 'leap']
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
		return withAuth(async () => {
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
		}, ['academic', 'leap']);
	}
}

export const attendanceService = serviceWrapper(
	AttendanceService,
	'AttendanceService'
);
