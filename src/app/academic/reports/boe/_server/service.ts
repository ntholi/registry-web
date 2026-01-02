import { eq } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import type { StudentModuleStatus } from '@/core/database';
import { db, terms } from '@/core/database';
import {
	getAcademicRemarks,
	summarizeModules,
} from '@/shared/lib/utils/grades';
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	type BoeFilter,
	type BoeSummarySchool,
	boeReportRepository,
	type ProgramSemesterReport,
} from './repository';
import { createWorksheet } from './worksheet';

type StudentSemester = Awaited<
	ReturnType<typeof boeReportRepository.getStudentSemestersWithFilter>
>[number];

type ModuleForRemarks = {
	code: string;
	name: string;
	grade: string;
	credits: number;
	status: StudentModuleStatus;
	semesterNumber: string;
	semesterModuleId: number;
};

type SemesterModuleData = {
	semesterNumber: string;
	modules: ModuleForRemarks[];
};

export interface BoePreviewStudent {
	studentId: number;
	studentName: string;
	programCode: string;
	programName: string;
	semesterNumber: string;
	modulesCount: number;
	creditsAttempted: number;
	creditsEarned: number;
	totalPoints: number;
	gpa: string;
	modules: {
		code: string;
		name: string;
		credits: number;
		marks: string;
		grade: string;
	}[];
}

export interface BoePreviewData {
	summary: BoeSummarySchool[];
	totalStudents: number;
	termCode: string;
}

export interface BoeClassReport {
	className: string;
	programCode: string;
	programName: string;
	semesterNumber: string;
	schoolName: string;
	students: {
		studentId: number;
		studentName: string;
		modules: {
			code: string;
			name: string;
			credits: number;
			marks: string;
			grade: string;
		}[];
		modulesCount: number;
		creditsAttempted: number;
		creditsEarned: number;
		totalPoints: number;
		gpa: string;
	}[];
	allModules: { code: string; name: string; credits: number }[];
}

export interface BoeSchoolGroupedReports {
	schoolName: string;
	reports: BoeClassReport[];
}

export default class BoeReportService {
	private repository = boeReportRepository;

	async getBoePreviewData(filter: BoeFilter): Promise<BoePreviewData> {
		const summary = await this.repository.getBoeSummary(filter);
		const totalStudents = summary.reduce((acc, s) => acc + s.totalStudents, 0);

		const term = await db.query.terms.findFirst({
			where: eq(terms.id, filter.termId),
		});

		return {
			summary,
			totalStudents,
			termCode: term?.code || '',
		};
	}

	async getBoeClassReports(
		filter: BoeFilter
	): Promise<BoeSchoolGroupedReports[]> {
		const studentSemesters =
			await this.repository.getStudentSemestersWithFilter(filter);

		const classMap = new Map<string, BoeClassReport>();

		for (const semester of studentSemesters) {
			const programCode = semester.studentProgram.structure.program.code;
			const semNum = semester.structureSemester?.semesterNumber || '01';
			const className = `${programCode}${formatSemester(semNum, 'mini')}`;

			if (!classMap.has(className)) {
				classMap.set(className, {
					className,
					programCode,
					programName: semester.studentProgram.structure.program.name,
					semesterNumber: semNum,
					schoolName:
						semester.studentProgram.structure.program.school?.name || '',
					students: [],
					allModules: [],
				});
			}

			const classReport = classMap.get(className)!;
			const currentModules = semester.studentModules;
			const currentSummary = summarizeModules(currentModules);

			const studentModules = currentModules.map((sm) => ({
				code: sm.semesterModule.module?.code || '',
				name: sm.semesterModule.module?.name || '',
				credits: Number(sm.credits),
				marks: sm.marks,
				grade: sm.grade,
			}));

			for (const mod of studentModules) {
				if (!classReport.allModules.find((m) => m.code === mod.code)) {
					classReport.allModules.push({
						code: mod.code,
						name: mod.name,
						credits: mod.credits,
					});
				}
			}

			classReport.students.push({
				studentId: semester.studentProgram.student.stdNo,
				studentName: semester.studentProgram.student.name,
				modules: studentModules,
				modulesCount: currentModules.length,
				creditsAttempted: currentSummary.creditsAttempted,
				creditsEarned: currentSummary.creditsCompleted,
				totalPoints: currentSummary.points,
				gpa: currentSummary.gpa.toFixed(2),
			});
		}

		const reports = Array.from(classMap.values());
		for (const report of reports) {
			report.students.sort((a, b) => parseFloat(b.gpa) - parseFloat(a.gpa));
		}

		// Group by school
		const schoolGroups = new Map<string, BoeClassReport[]>();
		for (const report of reports) {
			if (!schoolGroups.has(report.schoolName)) {
				schoolGroups.set(report.schoolName, []);
			}
			schoolGroups.get(report.schoolName)!.push(report);
		}

		return Array.from(schoolGroups.entries())
			.map(([schoolName, reports]) => ({
				schoolName,
				reports: reports.sort((a, b) => a.className.localeCompare(b.className)),
			}))
			.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
	}

	async generateBoeReportWithFilter(filter: BoeFilter): Promise<Buffer> {
		const term = await db.query.terms.findFirst({
			where: eq(terms.id, filter.termId),
		});
		if (!term) throw new Error('Term not found');

		const studentSemesters =
			await this.repository.getStudentSemestersWithFilter(filter);

		const schoolGroups = this.groupBySchool(
			studentSemesters as StudentSemester[]
		);

		const workbook = new ExcelJS.Workbook();

		for (const [_, schoolSemesters] of Object.entries(schoolGroups)) {
			const schoolName =
				schoolSemesters[0]?.studentProgram.structure.program.school.name ||
				'Unknown School';
			const programGroups = this.groupByProgram(schoolSemesters);

			for (const [programId, programSemesters] of Object.entries(
				programGroups
			)) {
				const semesterGroups = this.groupBySemesterNumber(programSemesters);

				for (const [semesterNumber, semesters] of Object.entries(
					semesterGroups
				)) {
					const updatedCurrentSemesters = await this.mapCurrentSemesterGrades(
						semesters as StudentSemester[]
					);

					const studentNumbers = updatedCurrentSemesters.map(
						(s) => s.studentProgram.student.stdNo
					);
					const allStudentSemesters =
						await this.repository.getStudentSemesterHistoryForStudents(
							studentNumbers
						);

					const programReport: ProgramSemesterReport = {
						programId: parseInt(programId, 10),
						programCode:
							semesters[0]?.studentProgram.structure.program.code || '',
						programName:
							semesters[0]?.studentProgram.structure.program.name || '',
						semesterNumber: semesterNumber,
						students: this.createStudentReports(
							updatedCurrentSemesters,
							allStudentSemesters as unknown as StudentSemester[],
							semesterNumber
						),
					};

					const sheetName = `${programReport.programCode}${formatSemester(semesterNumber, 'mini')}`;
					const worksheet = workbook.addWorksheet(sheetName);

					createWorksheet(worksheet, programReport, schoolName, term.code);
				}
			}
		}

		const buffer = await workbook.xlsx.writeBuffer();
		return Buffer.from(buffer);
	}

	private async mapCurrentSemesterGrades(semesters: StudentSemester[]) {
		return semesters;
	}

	private groupBySchool(studentSemesters: StudentSemester[]) {
		return studentSemesters.reduce(
			(groups, semester) => {
				const schoolId = semester.studentProgram.structure.program.school.id;
				if (!groups[schoolId]) {
					groups[schoolId] = [];
				}
				groups[schoolId].push(semester);
				return groups;
			},
			{} as Record<string, StudentSemester[]>
		);
	}

	private groupBySemesterNumber(studentSemesters: StudentSemester[]) {
		return studentSemesters.reduce(
			(groups, semester) => {
				const semesterNumber = semester.structureSemester?.semesterNumber || '';
				if (!groups[semesterNumber]) {
					groups[semesterNumber] = [];
				}
				groups[semesterNumber].push(semester);
				return groups;
			},
			{} as Record<string, StudentSemester[]>
		);
	}

	private groupByProgram(studentSemesters: StudentSemester[]) {
		return studentSemesters.reduce(
			(groups, semester) => {
				const programId = semester.studentProgram.structure.program.id;
				if (!groups[programId]) {
					groups[programId] = [];
				}
				groups[programId].push(semester);
				return groups;
			},
			{} as Record<string, StudentSemester[]>
		);
	}
	private createStudentReports(
		semesters: StudentSemester[],
		allStudentSemesters: StudentSemester[],
		_currentSemesterNumber: string
	) {
		const studentReports = semesters.map((semester) => {
			const student = semester.studentProgram.student;
			const studentSemesters = allStudentSemesters.filter(
				(s) => s.studentProgram.student.stdNo === student.stdNo
			);

			const allModules = studentSemesters.flatMap((s) => s.studentModules);
			const currentModules = semester.studentModules;

			const allSummary = summarizeModules(allModules);
			const currentSummary = summarizeModules(currentModules);

			const _currentSemesterModules = currentModules.map((sm) => ({
				code: sm.semesterModule.module?.code || '',
				name: sm.semesterModule.module?.name || '',
				grade: sm.grade,
				credits: Number(sm.credits),
				status: (sm.status as StudentModuleStatus) || 'Active',
			}));

			const historicalSemesters: SemesterModuleData[] = [];
			const semesterGroups = new Map<string, ModuleForRemarks[]>();

			studentSemesters.forEach((ss) => {
				const semNum = ss.structureSemester?.semesterNumber || '';
				if (!semesterGroups.has(semNum)) {
					semesterGroups.set(semNum, []);
				}

				ss.studentModules.forEach((sm) => {
					semesterGroups.get(semNum)!.push({
						code: sm.semesterModule.module?.code || '',
						name: sm.semesterModule.module?.name || '',
						grade: sm.grade,
						credits: Number(sm.credits),
						status: (sm.status as StudentModuleStatus) || 'Active',
						semesterNumber: semNum,
						semesterModuleId: sm.semesterModuleId,
					});
				});
			});

			historicalSemesters.push(
				...Array.from(semesterGroups.entries()).map(
					([semesterNumber, modules]) => ({
						semesterNumber,
						modules,
					})
				)
			);

			const programData = [
				{
					id: semester.studentProgram.id,
					status: semester.studentProgram.status,
					structureId: semester.studentProgram.structureId,
					intakeDate: semester.studentProgram.intakeDate,
					graduationDate: semester.studentProgram.graduationDate,
					structure: {
						id: semester.studentProgram.structure.id,
						code: semester.studentProgram.structure.code,
						desc: semester.studentProgram.structure.desc,
						programId: semester.studentProgram.structure.programId,
						createdAt: semester.studentProgram.structure.createdAt,
						program: {
							id: semester.studentProgram.structure.program.id,
							name: semester.studentProgram.structure.program.name,
							code: semester.studentProgram.structure.program.code,
							school: {
								id: semester.studentProgram.structure.program.schoolId,
								name: '',
							},
						},
					},
					semesters: studentSemesters.map((ss) => ({
						id: ss.id,
						termCode: ss.termCode,
						semesterNumber: ss.structureSemester?.semesterNumber ?? '',
						status: ss.status,
						studentModules: ss.studentModules.map((sm) => ({
							id: sm.id,
							semesterModuleId: sm.semesterModuleId,
							grade: sm.grade,
							marks: sm.marks,
							status: sm.status,
							credits: sm.credits,
							semesterModule: {
								type: sm.semesterModule.type,
								module: sm.semesterModule.module
									? {
											id: sm.semesterModule.module.id,
											code: sm.semesterModule.module.code,
											name: sm.semesterModule.module.name,
										}
									: null,
							},
						})),
					})),
				},
			];

			const facultyRemarksResult = getAcademicRemarks(programData);

			return {
				studentId: student.stdNo,
				studentName: student.name,
				studentModules: currentModules.map((sm) => ({
					studentId: student.stdNo,
					studentName: student.name,
					moduleCode: sm.semesterModule.module?.code || '',
					moduleName: sm.semesterModule.module?.name || '',
					credits: sm.credits,
					marks: sm.marks,
					grade: sm.grade,
				})),
				modulesCount: currentModules.length,
				creditsAttempted: currentSummary.creditsAttempted,
				creditsEarned: currentSummary.creditsCompleted,
				totalPoints: currentSummary.points,
				gpa: currentSummary.gpa.toFixed(2),
				cgpa: allSummary.gpa.toFixed(2),
				facultyRemark: facultyRemarksResult.message,
			};
		});

		return studentReports.sort(
			(a, b) => parseFloat(b.cgpa) - parseFloat(a.cgpa)
		);
	}
}

export const boeReportService = new BoeReportService();
