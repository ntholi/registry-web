import { and, eq, inArray, sql } from 'drizzle-orm';
import {
	attendance,
	db,
	modules,
	programs,
	schools,
	semesterModules,
	structureSemesters,
	structures,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
	terms,
} from '@/core/database';

export interface AttendanceReportFilter {
	termId?: number;
	schoolIds?: number[];
	programId?: number;
	semesterNumber?: string;
	weekNumber?: number;
}

export interface ClassAttendanceSummary {
	programCode: string;
	programName: string;
	semesterNumber: string;
	className: string;
	schoolCode: string;
	schoolName: string;
	totalStudents: number;
	avgAttendanceRate: number;
	totalPresent: number;
	totalAbsent: number;
	totalLate: number;
	totalExcused: number;
	atRiskCount: number;
}

export interface ModuleAttendanceSummary {
	moduleCode: string;
	moduleName: string;
	semesterModuleId: number;
	className: string;
	programCode: string;
	semesterNumber: string;
	totalStudents: number;
	avgAttendanceRate: number;
	atRiskCount: number;
}

export interface StudentModuleAttendance {
	moduleCode: string;
	moduleName: string;
	attendanceRate: number;
	present: number;
	absent: number;
	late: number;
	excused: number;
	totalMarked: number;
}

export interface StudentWithModuleAttendance {
	stdNo: number;
	name: string;
	programCode: string;
	programName: string;
	className: string;
	schoolCode: string;
	schoolName: string;
	overallAttendanceRate: number;
	modules: StudentModuleAttendance[];
}

export interface PaginatedStudentsResult {
	students: StudentWithModuleAttendance[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface AtRiskStudent {
	stdNo: number;
	name: string;
	programCode: string;
	programName: string;
	semesterNumber: string;
	className: string;
	schoolCode: string;
	schoolName: string;
	attendanceRate: number;
	presentCount: number;
	absentCount: number;
	lateCount: number;
	excusedCount: number;
	totalMarkedWeeks: number;
}

export interface ProgramAttendanceSummary {
	programId: number;
	programCode: string;
	programName: string;
	schoolCode: string;
	schoolName: string;
	totalStudents: number;
	avgAttendanceRate: number;
	atRiskCount: number;
	classes: ClassAttendanceSummary[];
}

export interface SchoolAttendanceSummary {
	schoolId: number;
	schoolCode: string;
	schoolName: string;
	totalStudents: number;
	avgAttendanceRate: number;
	atRiskCount: number;
	programs: ProgramAttendanceSummary[];
}

export interface OverviewStats {
	totalStudents: number;
	avgAttendanceRate: number;
	totalAtRisk: number;
	totalPresent: number;
	totalAbsent: number;
	totalLate: number;
	totalExcused: number;
	atRiskPercentage: number;
}

export interface AttendanceReportData {
	overview: OverviewStats;
	schools: SchoolAttendanceSummary[];
	atRiskStudents: AtRiskStudent[];
	moduleBreakdown: ModuleAttendanceSummary[];
}

const AT_RISK_THRESHOLD = 75;

export class AttendanceReportRepository {
	async getTerms() {
		return db.select().from(terms).orderBy(sql`${terms.code} DESC`);
	}

	async getTermById(termId: number) {
		const [term] = await db
			.select()
			.from(terms)
			.where(eq(terms.id, termId))
			.limit(1);
		return term;
	}

	async getSemesterModulesForFilter(
		programId?: number,
		semesterNumber?: string
	) {
		let query = db
			.select({
				id: semesterModules.id,
				moduleCode: modules.code,
				moduleName: modules.name,
				programCode: programs.code,
				semesterNumber: structureSemesters.semesterNumber,
			})
			.from(semesterModules)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.$dynamic();

		const conditions: ReturnType<typeof eq>[] = [];

		if (programId) {
			conditions.push(eq(programs.id, programId));
		}
		if (semesterNumber) {
			conditions.push(eq(structureSemesters.semesterNumber, semesterNumber));
		}

		if (conditions.length > 0) {
			query = query.where(and(...conditions));
		}

		return query.orderBy(modules.code);
	}

	async getAttendanceReportData(
		filter: AttendanceReportFilter
	): Promise<AttendanceReportData> {
		if (!filter.termId) {
			return {
				overview: {
					totalStudents: 0,
					avgAttendanceRate: 0,
					totalAtRisk: 0,
					totalPresent: 0,
					totalAbsent: 0,
					totalLate: 0,
					totalExcused: 0,
					atRiskPercentage: 0,
				},
				schools: [],
				atRiskStudents: [],
				moduleBreakdown: [],
			};
		}

		const term = await this.getTermById(filter.termId);
		if (!term) {
			throw new Error('Term not found');
		}

		const studentAttendanceData = await this.getStudentAttendanceData(
			term.code,
			filter
		);

		const overview = this.calculateOverview(studentAttendanceData);
		const schools = this.aggregateBySchool(studentAttendanceData);
		const atRiskStudents = studentAttendanceData
			.filter(
				(s) => s.attendanceRate < AT_RISK_THRESHOLD && s.totalMarkedWeeks > 0
			)
			.sort((a, b) => a.attendanceRate - b.attendanceRate);

		const moduleBreakdown = await this.getModuleBreakdown(term.code, filter);

		return {
			overview,
			schools,
			atRiskStudents,
			moduleBreakdown,
		};
	}

	private async getStudentAttendanceData(
		termCode: string,
		filter: AttendanceReportFilter
	): Promise<AtRiskStudent[]> {
		const conditions = [eq(studentSemesters.termCode, termCode)];

		if (filter.schoolIds && filter.schoolIds.length > 0) {
			conditions.push(inArray(schools.id, filter.schoolIds));
		}
		if (filter.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}
		if (filter.semesterNumber) {
			conditions.push(
				eq(structureSemesters.semesterNumber, filter.semesterNumber)
			);
		}

		conditions.push(
			inArray(studentSemesters.status, [
				'Active',
				'Enrolled',
				'Outstanding',
				'Repeat',
			])
		);

		const enrolledStudents = await db
			.selectDistinct({
				stdNo: students.stdNo,
				name: students.name,
				programCode: programs.code,
				programName: programs.name,
				semesterNumber: structureSemesters.semesterNumber,
				schoolCode: schools.code,
				schoolName: schools.name,
				schoolId: schools.id,
				programId: programs.id,
			})
			.from(studentSemesters)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(
				studentPrograms,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...conditions));

		if (enrolledStudents.length === 0) {
			return [];
		}

		const term = await db
			.select()
			.from(terms)
			.where(eq(terms.code, termCode))
			.limit(1);

		if (!term[0]) {
			return [];
		}

		const attendanceConditions = [eq(attendance.termId, term[0].id)];

		if (filter.weekNumber) {
			attendanceConditions.push(eq(attendance.weekNumber, filter.weekNumber));
		}

		const attendanceRecords = await db
			.select({
				stdNo: attendance.stdNo,
				status: attendance.status,
			})
			.from(attendance)
			.where(and(...attendanceConditions));

		const attendanceMap = new Map<
			number,
			{
				present: number;
				absent: number;
				late: number;
				excused: number;
				total: number;
			}
		>();

		for (const record of attendanceRecords) {
			if (!attendanceMap.has(record.stdNo)) {
				attendanceMap.set(record.stdNo, {
					present: 0,
					absent: 0,
					late: 0,
					excused: 0,
					total: 0,
				});
			}
			const stats = attendanceMap.get(record.stdNo)!;

			if (record.status === 'present') {
				stats.present++;
				stats.total++;
			} else if (record.status === 'absent') {
				stats.absent++;
				stats.total++;
			} else if (record.status === 'late') {
				stats.late++;
				stats.total++;
			} else if (record.status === 'excused') {
				stats.excused++;
				stats.total++;
			}
		}

		return enrolledStudents.map((student) => {
			const stats = attendanceMap.get(student.stdNo) || {
				present: 0,
				absent: 0,
				late: 0,
				excused: 0,
				total: 0,
			};

			const attendanceRate =
				stats.total > 0
					? Math.round(((stats.present + stats.late) / stats.total) * 100)
					: 0;

			const year =
				student.semesterNumber?.match(/Year (\d+)/)?.[1] ||
				(student.semesterNumber
					? Math.ceil(Number(student.semesterNumber) / 2).toString()
					: '');
			const sem =
				student.semesterNumber?.match(/Sem (\d+)/)?.[1] ||
				(student.semesterNumber
					? (Number(student.semesterNumber) % 2 === 0 ? 2 : 1).toString()
					: '');

			const className = `${student.programCode}Y${year}S${sem}`;

			return {
				stdNo: student.stdNo,
				name: student.name,
				programCode: student.programCode,
				programName: student.programName,
				semesterNumber: student.semesterNumber || '',
				className,
				schoolCode: student.schoolCode,
				schoolName: student.schoolName,
				attendanceRate,
				presentCount: stats.present,
				absentCount: stats.absent,
				lateCount: stats.late,
				excusedCount: stats.excused,
				totalMarkedWeeks: stats.total,
			};
		});
	}

	private calculateOverview(students: AtRiskStudent[]): OverviewStats {
		if (students.length === 0) {
			return {
				totalStudents: 0,
				avgAttendanceRate: 0,
				totalAtRisk: 0,
				totalPresent: 0,
				totalAbsent: 0,
				totalLate: 0,
				totalExcused: 0,
				atRiskPercentage: 0,
			};
		}

		const studentsWithAttendance = students.filter(
			(s) => s.totalMarkedWeeks > 0
		);
		const totalPresent = students.reduce((acc, s) => acc + s.presentCount, 0);
		const totalAbsent = students.reduce((acc, s) => acc + s.absentCount, 0);
		const totalLate = students.reduce((acc, s) => acc + s.lateCount, 0);
		const totalExcused = students.reduce((acc, s) => acc + s.excusedCount, 0);
		const totalAtRisk = studentsWithAttendance.filter(
			(s) => s.attendanceRate < AT_RISK_THRESHOLD
		).length;

		const avgAttendanceRate =
			studentsWithAttendance.length > 0
				? Math.round(
						studentsWithAttendance.reduce(
							(acc, s) => acc + s.attendanceRate,
							0
						) / studentsWithAttendance.length
					)
				: 0;

		return {
			totalStudents: students.length,
			avgAttendanceRate,
			totalAtRisk,
			totalPresent,
			totalAbsent,
			totalLate,
			totalExcused,
			atRiskPercentage:
				studentsWithAttendance.length > 0
					? Math.round((totalAtRisk / studentsWithAttendance.length) * 100)
					: 0,
		};
	}

	private aggregateBySchool(
		students: AtRiskStudent[]
	): SchoolAttendanceSummary[] {
		const schoolMap = new Map<
			string,
			{
				schoolCode: string;
				schoolName: string;
				programs: Map<
					string,
					{
						programCode: string;
						programName: string;
						classes: Map<string, AtRiskStudent[]>;
					}
				>;
			}
		>();

		for (const student of students) {
			if (!schoolMap.has(student.schoolCode)) {
				schoolMap.set(student.schoolCode, {
					schoolCode: student.schoolCode,
					schoolName: student.schoolName,
					programs: new Map(),
				});
			}

			const school = schoolMap.get(student.schoolCode)!;
			const programKey = student.programCode;

			if (!school.programs.has(programKey)) {
				school.programs.set(programKey, {
					programCode: student.programCode,
					programName: student.programName,
					classes: new Map(),
				});
			}

			const program = school.programs.get(programKey)!;
			const classKey = student.className;

			if (!program.classes.has(classKey)) {
				program.classes.set(classKey, []);
			}
			program.classes.get(classKey)!.push(student);
		}

		const result: SchoolAttendanceSummary[] = [];

		for (const [, school] of schoolMap) {
			const programSummaries: ProgramAttendanceSummary[] = [];

			for (const [, program] of school.programs) {
				const classSummaries: ClassAttendanceSummary[] = [];

				for (const [className, classStudents] of program.classes) {
					const studentsWithAttendance = classStudents.filter(
						(s) => s.totalMarkedWeeks > 0
					);
					const totalPresent = classStudents.reduce(
						(acc, s) => acc + s.presentCount,
						0
					);
					const totalAbsent = classStudents.reduce(
						(acc, s) => acc + s.absentCount,
						0
					);
					const totalLate = classStudents.reduce(
						(acc, s) => acc + s.lateCount,
						0
					);
					const totalExcused = classStudents.reduce(
						(acc, s) => acc + s.excusedCount,
						0
					);
					const atRiskCount = studentsWithAttendance.filter(
						(s) => s.attendanceRate < AT_RISK_THRESHOLD
					).length;
					const avgRate =
						studentsWithAttendance.length > 0
							? Math.round(
									studentsWithAttendance.reduce(
										(acc, s) => acc + s.attendanceRate,
										0
									) / studentsWithAttendance.length
								)
							: 0;

					classSummaries.push({
						programCode: program.programCode,
						programName: program.programName,
						semesterNumber: classStudents[0]?.semesterNumber || '',
						className,
						schoolCode: school.schoolCode,
						schoolName: school.schoolName,
						totalStudents: classStudents.length,
						avgAttendanceRate: avgRate,
						totalPresent,
						totalAbsent,
						totalLate,
						totalExcused,
						atRiskCount,
					});
				}

				const allProgramStudents = Array.from(program.classes.values()).flat();
				const programStudentsWithAttendance = allProgramStudents.filter(
					(s) => s.totalMarkedWeeks > 0
				);
				const programAtRisk = programStudentsWithAttendance.filter(
					(s) => s.attendanceRate < AT_RISK_THRESHOLD
				).length;
				const programAvgRate =
					programStudentsWithAttendance.length > 0
						? Math.round(
								programStudentsWithAttendance.reduce(
									(acc, s) => acc + s.attendanceRate,
									0
								) / programStudentsWithAttendance.length
							)
						: 0;

				programSummaries.push({
					programId: 0,
					programCode: program.programCode,
					programName: program.programName,
					schoolCode: school.schoolCode,
					schoolName: school.schoolName,
					totalStudents: allProgramStudents.length,
					avgAttendanceRate: programAvgRate,
					atRiskCount: programAtRisk,
					classes: classSummaries.sort((a, b) =>
						a.className.localeCompare(b.className)
					),
				});
			}

			const _allSchoolStudents = programSummaries.flatMap((p) =>
				p.classes.flatMap((c) => c.totalStudents)
			);
			const schoolTotalStudents = programSummaries.reduce(
				(acc, p) => acc + p.totalStudents,
				0
			);
			const schoolAtRisk = programSummaries.reduce(
				(acc, p) => acc + p.atRiskCount,
				0
			);
			const schoolAvgRate =
				programSummaries.length > 0
					? Math.round(
							programSummaries.reduce(
								(acc, p) => acc + p.avgAttendanceRate * p.totalStudents,
								0
							) / schoolTotalStudents
						)
					: 0;

			result.push({
				schoolId: 0,
				schoolCode: school.schoolCode,
				schoolName: school.schoolName,
				totalStudents: schoolTotalStudents,
				avgAttendanceRate: schoolAvgRate || 0,
				atRiskCount: schoolAtRisk,
				programs: programSummaries.sort((a, b) =>
					a.programCode.localeCompare(b.programCode)
				),
			});
		}

		return result.sort((a, b) => a.schoolCode.localeCompare(b.schoolCode));
	}

	private async getModuleBreakdown(
		termCode: string,
		filter: AttendanceReportFilter
	): Promise<ModuleAttendanceSummary[]> {
		const term = await db
			.select()
			.from(terms)
			.where(eq(terms.code, termCode))
			.limit(1);

		if (!term[0]) {
			return [];
		}

		const conditions = [eq(studentSemesters.termCode, termCode)];

		if (filter.schoolIds && filter.schoolIds.length > 0) {
			conditions.push(inArray(schools.id, filter.schoolIds));
		}
		if (filter.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}
		if (filter.semesterNumber) {
			conditions.push(
				eq(structureSemesters.semesterNumber, filter.semesterNumber)
			);
		}

		conditions.push(
			inArray(studentSemesters.status, [
				'Active',
				'Enrolled',
				'Outstanding',
				'Repeat',
			])
		);

		const moduleEnrollments = await db
			.select({
				semesterModuleId: semesterModules.id,
				moduleCode: modules.code,
				moduleName: modules.name,
				programCode: programs.code,
				semesterNumber: structureSemesters.semesterNumber,
				stdNo: students.stdNo,
			})
			.from(studentModules)
			.innerJoin(
				studentSemesters,
				eq(studentModules.studentSemesterId, studentSemesters.id)
			)
			.innerJoin(
				semesterModules,
				eq(studentModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(
				studentPrograms,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.where(
				and(
					...conditions,
					sql`${studentModules.status} NOT IN ('Delete', 'Drop')`
				)
			);

		const attendanceConditions = [eq(attendance.termId, term[0].id)];
		if (filter.weekNumber) {
			attendanceConditions.push(eq(attendance.weekNumber, filter.weekNumber));
		}

		const attendanceRecords = await db
			.select({
				semesterModuleId: attendance.semesterModuleId,
				stdNo: attendance.stdNo,
				status: attendance.status,
			})
			.from(attendance)
			.where(and(...attendanceConditions));

		const moduleAttendanceMap = new Map<
			number,
			Map<
				number,
				{ present: number; absent: number; late: number; total: number }
			>
		>();

		for (const record of attendanceRecords) {
			if (!moduleAttendanceMap.has(record.semesterModuleId)) {
				moduleAttendanceMap.set(record.semesterModuleId, new Map());
			}
			const moduleMap = moduleAttendanceMap.get(record.semesterModuleId)!;

			if (!moduleMap.has(record.stdNo)) {
				moduleMap.set(record.stdNo, {
					present: 0,
					absent: 0,
					late: 0,
					total: 0,
				});
			}
			const stats = moduleMap.get(record.stdNo)!;

			if (record.status === 'present') {
				stats.present++;
				stats.total++;
			} else if (record.status === 'absent') {
				stats.absent++;
				stats.total++;
			} else if (record.status === 'late') {
				stats.late++;
				stats.total++;
			}
		}

		const moduleGroups = new Map<
			number,
			{
				moduleCode: string;
				moduleName: string;
				programCode: string;
				semesterNumber: string;
				students: Set<number>;
			}
		>();

		for (const enrollment of moduleEnrollments) {
			if (!moduleGroups.has(enrollment.semesterModuleId)) {
				moduleGroups.set(enrollment.semesterModuleId, {
					moduleCode: enrollment.moduleCode,
					moduleName: enrollment.moduleName,
					programCode: enrollment.programCode,
					semesterNumber: enrollment.semesterNumber || '',
					students: new Set(),
				});
			}
			moduleGroups
				.get(enrollment.semesterModuleId)!
				.students.add(enrollment.stdNo);
		}

		const result: ModuleAttendanceSummary[] = [];

		for (const [semesterModuleId, group] of moduleGroups) {
			const moduleAttendance = moduleAttendanceMap.get(semesterModuleId);
			let totalRate = 0;
			let studentsWithAttendance = 0;
			let atRiskCount = 0;

			for (const stdNo of group.students) {
				const stats = moduleAttendance?.get(stdNo);
				if (stats && stats.total > 0) {
					const rate = Math.round(
						((stats.present + stats.late) / stats.total) * 100
					);
					totalRate += rate;
					studentsWithAttendance++;
					if (rate < AT_RISK_THRESHOLD) {
						atRiskCount++;
					}
				}
			}

			const year =
				group.semesterNumber.match(/Year (\d+)/)?.[1] ||
				(group.semesterNumber
					? Math.ceil(Number(group.semesterNumber) / 2).toString()
					: '');
			const sem =
				group.semesterNumber.match(/Sem (\d+)/)?.[1] ||
				(group.semesterNumber
					? (Number(group.semesterNumber) % 2 === 0 ? 2 : 1).toString()
					: '');
			const className = `${group.programCode}Y${year}S${sem}`;

			result.push({
				moduleCode: group.moduleCode,
				moduleName: group.moduleName,
				semesterModuleId,
				className,
				programCode: group.programCode,
				semesterNumber: group.semesterNumber,
				totalStudents: group.students.size,
				avgAttendanceRate:
					studentsWithAttendance > 0
						? Math.round(totalRate / studentsWithAttendance)
						: 0,
				atRiskCount,
			});
		}

		return result.sort((a, b) => a.avgAttendanceRate - b.avgAttendanceRate);
	}

	async getPaginatedStudentsWithModuleAttendance(
		filter: AttendanceReportFilter,
		page = 1,
		pageSize = 20,
		search?: string
	): Promise<PaginatedStudentsResult> {
		if (!filter.termId) {
			return { students: [], total: 0, page, pageSize, totalPages: 0 };
		}

		const term = await this.getTermById(filter.termId);
		if (!term) {
			throw new Error('Term not found');
		}

		const conditions = [eq(studentSemesters.termCode, term.code)];

		if (filter.schoolIds && filter.schoolIds.length > 0) {
			conditions.push(inArray(schools.id, filter.schoolIds));
		}
		if (filter.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}
		if (filter.semesterNumber) {
			conditions.push(
				eq(structureSemesters.semesterNumber, filter.semesterNumber)
			);
		}

		conditions.push(
			inArray(studentSemesters.status, [
				'Active',
				'Enrolled',
				'Outstanding',
				'Repeat',
			])
		);

		if (search) {
			const searchLower = search.toLowerCase();
			conditions.push(
				sql`(LOWER(${students.name}) LIKE ${`%${searchLower}%`} OR ${students.stdNo}::text LIKE ${`%${search}%`} OR LOWER(${programs.code}) LIKE ${`%${searchLower}%`})`
			);
		}

		const enrolledStudentsQuery = db
			.selectDistinct({
				stdNo: students.stdNo,
				name: students.name,
				programCode: programs.code,
				programName: programs.name,
				semesterNumber: structureSemesters.semesterNumber,
				schoolCode: schools.code,
				schoolName: schools.name,
			})
			.from(studentSemesters)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(
				studentPrograms,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...conditions));

		const allStudents = await enrolledStudentsQuery;
		const total = allStudents.length;
		const totalPages = Math.ceil(total / pageSize);

		const studentMap = new Map<
			number,
			{
				stdNo: number;
				name: string;
				programCode: string;
				programName: string;
				semesterNumber: string;
				schoolCode: string;
				schoolName: string;
			}
		>();
		for (const s of allStudents) {
			studentMap.set(s.stdNo, s);
		}

		const paginatedStdNos = allStudents
			.slice((page - 1) * pageSize, page * pageSize)
			.map((s) => s.stdNo);

		if (paginatedStdNos.length === 0) {
			return { students: [], total, page, pageSize, totalPages };
		}

		const moduleEnrollments = await db
			.select({
				stdNo: students.stdNo,
				semesterModuleId: semesterModules.id,
				moduleCode: modules.code,
				moduleName: modules.name,
			})
			.from(studentModules)
			.innerJoin(
				studentSemesters,
				eq(studentModules.studentSemesterId, studentSemesters.id)
			)
			.innerJoin(
				semesterModules,
				eq(studentModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				studentPrograms,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.where(
				and(
					eq(studentSemesters.termCode, term.code),
					inArray(students.stdNo, paginatedStdNos),
					sql`${studentModules.status} NOT IN ('Delete', 'Drop')`
				)
			);

		const attendanceConditions = [
			eq(attendance.termId, term.id),
			inArray(attendance.stdNo, paginatedStdNos),
		];

		if (filter.weekNumber) {
			attendanceConditions.push(eq(attendance.weekNumber, filter.weekNumber));
		}

		const attendanceRecords = await db
			.select({
				stdNo: attendance.stdNo,
				semesterModuleId: attendance.semesterModuleId,
				status: attendance.status,
			})
			.from(attendance)
			.where(and(...attendanceConditions));

		const studentModuleAttendanceMap = new Map<
			number,
			Map<
				number,
				{
					moduleCode: string;
					moduleName: string;
					present: number;
					absent: number;
					late: number;
					excused: number;
					total: number;
				}
			>
		>();

		for (const enrollment of moduleEnrollments) {
			if (!studentModuleAttendanceMap.has(enrollment.stdNo)) {
				studentModuleAttendanceMap.set(enrollment.stdNo, new Map());
			}
			const moduleMap = studentModuleAttendanceMap.get(enrollment.stdNo)!;
			if (!moduleMap.has(enrollment.semesterModuleId)) {
				moduleMap.set(enrollment.semesterModuleId, {
					moduleCode: enrollment.moduleCode,
					moduleName: enrollment.moduleName,
					present: 0,
					absent: 0,
					late: 0,
					excused: 0,
					total: 0,
				});
			}
		}

		for (const record of attendanceRecords) {
			const moduleMap = studentModuleAttendanceMap.get(record.stdNo);
			if (!moduleMap) continue;

			const moduleStats = moduleMap.get(record.semesterModuleId);
			if (!moduleStats) continue;

			if (record.status === 'present') {
				moduleStats.present++;
				moduleStats.total++;
			} else if (record.status === 'absent') {
				moduleStats.absent++;
				moduleStats.total++;
			} else if (record.status === 'late') {
				moduleStats.late++;
				moduleStats.total++;
			} else if (record.status === 'excused') {
				moduleStats.excused++;
				moduleStats.total++;
			}
		}

		const studentResults: StudentWithModuleAttendance[] = [];

		for (const stdNo of paginatedStdNos) {
			const studentInfo = studentMap.get(stdNo);
			if (!studentInfo) continue;

			const year =
				studentInfo.semesterNumber?.match(/Year (\d+)/)?.[1] ||
				(studentInfo.semesterNumber
					? Math.ceil(Number(studentInfo.semesterNumber) / 2).toString()
					: '');
			const sem =
				studentInfo.semesterNumber?.match(/Sem (\d+)/)?.[1] ||
				(studentInfo.semesterNumber
					? (Number(studentInfo.semesterNumber) % 2 === 0 ? 2 : 1).toString()
					: '');
			const className = `${studentInfo.programCode}Y${year}S${sem}`;

			const moduleMap = studentModuleAttendanceMap.get(stdNo);
			const modulesList: StudentModuleAttendance[] = [];

			let totalPresent = 0;
			let totalMarked = 0;

			if (moduleMap) {
				for (const [, stats] of moduleMap) {
					const rate =
						stats.total > 0
							? Math.round(((stats.present + stats.late) / stats.total) * 100)
							: 0;

					modulesList.push({
						moduleCode: stats.moduleCode,
						moduleName: stats.moduleName,
						attendanceRate: rate,
						present: stats.present,
						absent: stats.absent,
						late: stats.late,
						excused: stats.excused,
						totalMarked: stats.total,
					});

					totalPresent += stats.present + stats.late;
					totalMarked += stats.total;
				}
			}

			modulesList.sort((a, b) => a.moduleCode.localeCompare(b.moduleCode));

			const overallRate =
				totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

			studentResults.push({
				stdNo,
				name: studentInfo.name,
				programCode: studentInfo.programCode,
				programName: studentInfo.programName,
				className,
				schoolCode: studentInfo.schoolCode,
				schoolName: studentInfo.schoolName,
				overallAttendanceRate: overallRate,
				modules: modulesList,
			});
		}

		return { students: studentResults, total, page, pageSize, totalPages };
	}
}

export const attendanceReportRepository = new AttendanceReportRepository();
