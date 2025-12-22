import ExcelJS from 'exceljs';
import type { StudentModuleStatus, schools } from '@/core/database';
import { getCurrentTerm } from '@/modules/registry/features/dates/terms';
import {
	getAcademicRemarks,
	summarizeModules,
} from '@/shared/lib/utils/grades';
import { formatSemester } from '@/shared/lib/utils/utils';
import { boeReportRepository, type ProgramSemesterReport } from './repository';
import { createWorksheet } from './worksheet';

type School = typeof schools.$inferSelect;
type StudentSemester = Awaited<
	ReturnType<typeof boeReportRepository.getStudentSemestersForFaculty>
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

export default class BoeReportService {
	private repository = boeReportRepository;
	async generateBoeReportForFaculty(school: School): Promise<Buffer> {
		const currentTerm = await getCurrentTerm();
		if (!currentTerm) {
			throw new Error('No active term found');
		}

		const studentSemesters =
			await this.repository.getStudentSemestersForFaculty(
				school.id,
				currentTerm.code
			);

		const programGroups = this.groupByProgram(
			studentSemesters as StudentSemester[]
		);

		const workbook = new ExcelJS.Workbook();

		for (const [programId, programSemesters] of Object.entries(programGroups)) {
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
						allStudentSemesters as StudentSemester[],
						semesterNumber
					),
				};

				const sheetName = `${programReport.programCode}${formatSemester(semesterNumber, 'mini')}`;
				const worksheet = workbook.addWorksheet(sheetName);

				createWorksheet(
					worksheet,
					programReport,
					school.name,
					currentTerm.code
				);
			}
		}

		const buffer = await workbook.xlsx.writeBuffer();
		return Buffer.from(buffer);
	}
	private async mapCurrentSemesterGrades(semesters: StudentSemester[]) {
		return semesters;
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
