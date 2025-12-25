import { and, eq, sql } from 'drizzle-orm';
import {
	type AttendanceStatus,
	assignedModules,
	attendance,
	db,
	modules,
	semesterModules,
	structureSemesters,
	structures,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
	terms,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export type AttendanceRecord = typeof attendance.$inferInsert;

export type StudentAttendance = {
	stdNo: number;
	name: string;
	attendanceId: number | null;
	status: AttendanceStatus;
};

export type WeekInfo = {
	weekNumber: number;
	startDate: Date;
	endDate: Date;
	isCurrent: boolean;
};

export default class AttendanceRepository extends BaseRepository<
	typeof attendance,
	'id'
> {
	constructor() {
		super(attendance, attendance.id);
	}

	async getWeeksForTerm(termId: number): Promise<WeekInfo[]> {
		const term = await db.query.terms.findFirst({
			where: eq(terms.id, termId),
		});

		if (!term?.startDate || !term?.endDate) {
			return [];
		}

		const startDate = new Date(term.startDate);
		const endDate = new Date(term.endDate);
		const today = new Date();
		const weeks: WeekInfo[] = [];
		let weekNumber = 1;
		const currentWeekStart = new Date(startDate);

		while (currentWeekStart <= endDate) {
			const weekEnd = new Date(currentWeekStart);
			weekEnd.setDate(weekEnd.getDate() + 6);

			const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
			const isCurrent = today >= currentWeekStart && today <= actualWeekEnd;

			weeks.push({
				weekNumber,
				startDate: new Date(currentWeekStart),
				endDate: actualWeekEnd,
				isCurrent,
			});

			currentWeekStart.setDate(currentWeekStart.getDate() + 7);
			weekNumber++;
		}

		return weeks;
	}

	async getStudentsForModule(
		semesterModuleId: number,
		termCode: string
	): Promise<{ stdNo: number; name: string; studentModuleId: number }[]> {
		return await db
			.select({
				stdNo: students.stdNo,
				name: students.name,
				studentModuleId: studentModules.id,
			})
			.from(students)
			.innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(
				studentSemesters,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(
				studentModules,
				eq(studentModules.studentSemesterId, studentSemesters.id)
			)
			.where(
				and(
					eq(studentModules.semesterModuleId, semesterModuleId),
					eq(studentSemesters.termCode, termCode),
					sql`${studentModules.status} NOT IN ('Delete', 'Drop')`
				)
			)
			.groupBy(students.stdNo, students.name, studentModules.id)
			.orderBy(students.name);
	}

	async getAttendanceForWeek(
		semesterModuleId: number,
		termId: number,
		weekNumber: number,
		termCode: string
	): Promise<StudentAttendance[]> {
		const studentsInModule = await this.getStudentsForModule(
			semesterModuleId,
			termCode
		);

		const existingAttendance = await db
			.select({
				stdNo: attendance.stdNo,
				status: attendance.status,
				id: attendance.id,
			})
			.from(attendance)
			.where(
				and(
					eq(attendance.semesterModuleId, semesterModuleId),
					eq(attendance.termId, termId),
					eq(attendance.weekNumber, weekNumber)
				)
			);

		const attendanceMap = new Map(
			existingAttendance.map((a) => [a.stdNo, { id: a.id, status: a.status }])
		);

		return studentsInModule.map((student) => {
			const existing = attendanceMap.get(student.stdNo);
			return {
				stdNo: student.stdNo,
				name: student.name,
				attendanceId: existing?.id ?? null,
				status: existing?.status ?? 'na',
			};
		});
	}

	async upsertAttendance(
		records: {
			stdNo: number;
			semesterModuleId: number;
			termId: number;
			weekNumber: number;
			status: AttendanceStatus;
			assignedModuleId: number;
			markedBy: string;
		}[]
	) {
		if (records.length === 0) return [];

		return await db.transaction(async (tx) => {
			const results = [];

			for (const record of records) {
				const existing = await tx
					.select({ id: attendance.id })
					.from(attendance)
					.where(
						and(
							eq(attendance.stdNo, record.stdNo),
							eq(attendance.semesterModuleId, record.semesterModuleId),
							eq(attendance.termId, record.termId),
							eq(attendance.weekNumber, record.weekNumber)
						)
					)
					.limit(1);

				if (existing.length > 0) {
					const updated = await tx
						.update(attendance)
						.set({
							status: record.status,
							markedBy: record.markedBy,
							markedAt: new Date(),
						})
						.where(eq(attendance.id, existing[0].id))
						.returning();
					results.push(...updated);
				} else {
					const inserted = await tx
						.insert(attendance)
						.values({
							stdNo: record.stdNo,
							semesterModuleId: record.semesterModuleId,
							termId: record.termId,
							weekNumber: record.weekNumber,
							status: record.status,
							assignedModuleId: record.assignedModuleId,
							markedBy: record.markedBy,
						})
						.returning();
					results.push(...inserted);
				}
			}

			return results;
		});
	}

	async getAttendanceSummaryForModule(
		semesterModuleId: number,
		termId: number,
		termCode: string
	) {
		const studentsInModule = await this.getStudentsForModule(
			semesterModuleId,
			termCode
		);
		const weeks = await this.getWeeksForTerm(termId);

		const allAttendance = await db
			.select({
				stdNo: attendance.stdNo,
				weekNumber: attendance.weekNumber,
				status: attendance.status,
			})
			.from(attendance)
			.where(
				and(
					eq(attendance.semesterModuleId, semesterModuleId),
					eq(attendance.termId, termId)
				)
			);

		const attendanceMap = new Map<string, AttendanceStatus>();
		allAttendance.forEach((a) => {
			attendanceMap.set(`${a.stdNo}-${a.weekNumber}`, a.status);
		});

		return studentsInModule.map((student) => {
			const weeklyAttendance = weeks.map((week) => ({
				weekNumber: week.weekNumber,
				status:
					attendanceMap.get(`${student.stdNo}-${week.weekNumber}`) ?? 'na',
			}));

			const presentCount = weeklyAttendance.filter(
				(w) => w.status === 'present'
			).length;
			const absentCount = weeklyAttendance.filter(
				(w) => w.status === 'absent'
			).length;
			const lateCount = weeklyAttendance.filter(
				(w) => w.status === 'late'
			).length;
			const excusedCount = weeklyAttendance.filter(
				(w) => w.status === 'excused'
			).length;
			const markedWeeks = weeklyAttendance.filter(
				(w) => w.status !== 'na'
			).length;

			const attendanceRate =
				markedWeeks > 0
					? Math.round(((presentCount + lateCount) / markedWeeks) * 100)
					: 0;

			return {
				stdNo: student.stdNo,
				name: student.name,
				weeklyAttendance,
				presentCount,
				absentCount,
				lateCount,
				excusedCount,
				attendanceRate,
				totalWeeks: weeks.length,
				markedWeeks,
			};
		});
	}

	async deleteAttendanceForWeek(
		semesterModuleId: number,
		termId: number,
		weekNumber: number
	) {
		return await db
			.delete(attendance)
			.where(
				and(
					eq(attendance.semesterModuleId, semesterModuleId),
					eq(attendance.termId, termId),
					eq(attendance.weekNumber, weekNumber)
				)
			)
			.returning();
	}

	async getAssignedModulesWithDetails(userId: string) {
		return await db
			.select({
				assignedModuleId: assignedModules.id,
				semesterModuleId: semesterModules.id,
				moduleCode: modules.code,
				moduleName: modules.name,
				programId: structures.programId,
				semesterName: structureSemesters.name,
				termId: assignedModules.termId,
			})
			.from(assignedModules)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.where(
				and(
					eq(assignedModules.userId, userId),
					eq(assignedModules.active, true)
				)
			)
			.orderBy(modules.code);
	}
}

export const attendanceRepository = new AttendanceRepository();
