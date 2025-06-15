import { ModuleStatus, schools } from '@/db/schema';
import { termsRepository } from '@/server/terms/repository';
import { summarizeModules } from '@/utils/grades';
import ExcelJS from 'exceljs';
import { boeReportRepository, ProgramSemesterReport } from './repository';
import { createWorksheet } from './worksheet';

type School = typeof schools.$inferSelect;
type StudentSemester = Awaited<
  ReturnType<typeof boeReportRepository.getStudentSemestersForFaculty>
>[number];

export default class BoeReportService {
  private repository = boeReportRepository;

  async generateBoeReportForFaculty(school: School): Promise<Buffer> {
    const currentTerm = await termsRepository.getActive();
    if (!currentTerm) {
      throw new Error('No active term found');
    }

    const studentSemesters =
      await this.repository.getStudentSemestersForFaculty(
        school.id,
        currentTerm.name,
      );

    const allStudentSemesters =
      await this.repository.getStudentSemesterHistoryForFaculty(school.id);

    const programGroups = this.groupByProgram(
      studentSemesters as StudentSemester[],
    );

    const workbook = new ExcelJS.Workbook();

    for (const [programId, programSemesters] of Object.entries(programGroups)) {
      const semesterGroups = this.groupBySemesterNumber(programSemesters);

      for (const [semesterNumber, semesters] of Object.entries(
        semesterGroups,
      )) {
        const programReport: ProgramSemesterReport = {
          programId: parseInt(programId),
          programCode:
            semesters[0]?.studentProgram.structure.program.code || '',
          programName:
            semesters[0]?.studentProgram.structure.program.name || '',
          semesterNumber: parseInt(semesterNumber),
          students: this.createStudentReports(
            semesters as StudentSemester[],
            allStudentSemesters as StudentSemester[],
          ),
        };

        const year = Math.ceil(parseInt(semesterNumber) / 2);
        const semester = parseInt(semesterNumber) % 2 === 0 ? 2 : 1;
        const sheetName = `${programReport.programCode}Y${year}S${semester}`;
        const worksheet = workbook.addWorksheet(sheetName);

        createWorksheet(
          worksheet,
          programReport,
          school.name,
          currentTerm.name,
        );
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private groupBySemesterNumber(studentSemesters: StudentSemester[]) {
    return studentSemesters.reduce(
      (groups, semester) => {
        const semesterNumber = semester.semesterNumber || 0;
        if (!groups[semesterNumber]) {
          groups[semesterNumber] = [];
        }
        groups[semesterNumber].push(semester);
        return groups;
      },
      {} as Record<string, StudentSemester[]>,
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
      {} as Record<string, StudentSemester[]>,
    );
  }
  private createStudentReports(
    semesters: StudentSemester[],
    allStudentSemesters: StudentSemester[],
  ) {
    return semesters.map((semester) => {
      const student = semester.studentProgram.student;
      const studentSemesters = allStudentSemesters.filter(
        (s) => s.studentProgram.student.stdNo === student.stdNo,
      );

      const allModules = studentSemesters.flatMap((s) => s.studentModules);
      const currentModules = semester.studentModules;

      const moduleData = (modules: typeof allModules) =>
        modules.map((sm) => ({
          grade: sm.grade,
          credits: Number(sm.semesterModule.credits),
          status: (sm.status as ModuleStatus) || 'Active',
        }));

      const allSummary = summarizeModules(moduleData(allModules));
      const currentSummary = summarizeModules(moduleData(currentModules));

      return {
        studentId: student.stdNo,
        studentName: student.name,
        studentModules: currentModules.map((sm) => ({
          studentId: student.stdNo,
          studentName: student.name,
          moduleCode: sm.semesterModule.module?.code || '',
          moduleName: sm.semesterModule.module?.name || '',
          credits: sm.semesterModule.credits,
          marks: sm.marks,
          grade: sm.grade,
        })),
        modulesCount: currentModules.length,
        creditsAttempted: currentSummary.creditsAttempted,
        creditsEarned: currentSummary.creditsCompleted,
        totalPoints: currentSummary.points,
        gpa: currentSummary.gpa.toFixed(2),
        cgpa: allSummary.gpa.toFixed(2),
      };
    });
  }
}

export const boeReportService = new BoeReportService();
