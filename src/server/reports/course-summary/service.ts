import { Packer } from 'docx';
import { termsRepository } from '@/server/terms/repository';
import { courseSummaryRepository, CourseSummaryReport } from './repository';
import { createCourseSummaryDocument } from './document';
import { db } from '@/db';
import { Grade, moduleGrades, studentModules } from '@/db/schema';
import { and, inArray, eq } from 'drizzle-orm';

export default class CourseSummaryService {
  private repository = courseSummaryRepository;

  async generateCourseSummaryReport(
    programId: number | undefined,
    semesterModuleId: number,
  ): Promise<Buffer> {
    const currentTerm = await termsRepository.getActive();
    if (!currentTerm) {
      throw new Error('No active term found');
    }

    let reportData = await this.repository.getCourseSummaryData(
      semesterModuleId,
      currentTerm.name,
      programId,
    );

    if (!reportData) {
      throw new Error('Course data not found');
    }

    reportData = await this.mapCurrentModuleGrades(
      reportData,
      semesterModuleId,
    );

    const document = createCourseSummaryDocument(reportData);
    const buffer = await Packer.toBuffer(document);
    return Buffer.from(buffer);
  }

  private async mapCurrentModuleGrades(
    reportData: CourseSummaryReport,
    semesterModuleId: number,
  ): Promise<CourseSummaryReport> {
    const studentModuleData = await db.query.studentModules.findMany({
      where: eq(studentModules.semesterModuleId, semesterModuleId),
      with: {
        studentSemester: {
          with: {
            studentProgram: {
              with: {
                student: true,
              },
            },
          },
        },
        semesterModule: {
          with: {
            module: true,
          },
        },
      },
    });

    if (studentModuleData.length === 0) {
      return reportData;
    }

    const moduleId = studentModuleData[0]?.semesterModule.module?.id;
    if (!moduleId) {
      return reportData;
    }

    const stdNos = studentModuleData.map(
      (sm) => sm.studentSemester!.studentProgram.student.stdNo,
    );

    const moduleGradesData = await db.query.moduleGrades.findMany({
      where: and(
        eq(moduleGrades.moduleId, moduleId),
        inArray(moduleGrades.stdNo, stdNos),
      ),
    });

    const gradesMap = new Map<
      number,
      { grade: Grade; weightedTotal: number }
    >();
    moduleGradesData.forEach((gradeData) => {
      gradesMap.set(gradeData.stdNo, {
        grade: gradeData.grade,
        weightedTotal: gradeData.weightedTotal,
      });
    });

    const updatedFailedStudents = reportData.failedStudents.map((student) => {
      const gradeData = gradesMap.get(student.studentId);
      if (gradeData) {
        const marks = gradeData.weightedTotal;
        const isNumericMark = !isNaN(marks);

        let reason = '';
        let actionTaken = '';

        if (
          this.isFailingGrade(gradeData.grade) ||
          (isNumericMark && marks < 50)
        ) {
          reason = `Failed ${gradeData.grade === 'F' ? 'Final Exam' : 'Module'} (${marks}/${100})`;
          actionTaken = 'STUDENT TO REPEAT THE MODULE';
        } else if (
          this.isSupplementaryGrade(gradeData.grade) ||
          (isNumericMark && marks >= 40 && marks < 50)
        ) {
          reason = `Failed Final Exam (${marks}/${100})`;
          actionTaken = 'STUDENT TO SUPPLEMENT THE EXAM';
        }

        return {
          ...student,
          marks: marks.toString(),
          grade: gradeData.grade,
          reason,
          actionTaken,
        };
      }
      return student;
    });

    const updatedSupplementaryStudents = reportData.supplementaryStudents.map(
      (student) => {
        const gradeData = gradesMap.get(student.studentId);
        if (gradeData) {
          const marks = gradeData.weightedTotal;
          const isNumericMark = !isNaN(marks);

          let reason = '';
          let actionTaken = '';

          if (
            this.isFailingGrade(gradeData.grade) ||
            (isNumericMark && marks < 50)
          ) {
            reason = `Failed ${gradeData.grade === 'F' ? 'Final Exam' : 'Module'} (${marks}/${100})`;
            actionTaken = 'STUDENT TO REPEAT THE MODULE';
          } else if (
            this.isSupplementaryGrade(gradeData.grade) ||
            (isNumericMark && marks >= 40 && marks < 50)
          ) {
            reason = `Failed Final Exam (${marks}/${100})`;
            actionTaken = 'STUDENT TO SUPPLEMENT THE EXAM';
          }

          return {
            ...student,
            marks: marks.toString(),
            grade: gradeData.grade,
            reason,
            actionTaken,
          };
        }
        return student;
      },
    );

    let totalPasses = 0;
    const newFailedStudents: typeof reportData.failedStudents = [];
    const newSupplementaryStudents: typeof reportData.supplementaryStudents =
      [];

    studentModuleData.forEach((sm) => {
      const student = sm.studentSemester!.studentProgram.student;
      const gradeData = gradesMap.get(student.stdNo);

      if (gradeData) {
        const marks = gradeData.weightedTotal;
        const grade = gradeData.grade;
        const isNumericMark = !isNaN(marks);

        let reason = '';
        let actionTaken = '';

        if (this.isFailingGrade(grade) || (isNumericMark && marks < 50)) {
          reason = `Failed ${grade === 'F' ? 'Final Exam' : 'Module'} (${marks}/${100})`;
          actionTaken = 'STUDENT TO REPEAT THE MODULE';

          newFailedStudents.push({
            studentId: student.stdNo,
            studentName: student.name,
            studentNumber: student.stdNo.toString(),
            marks: marks.toString(),
            grade,
            status: sm.status,
            reason,
            actionTaken,
          });
        } else if (
          this.isSupplementaryGrade(grade) ||
          (isNumericMark && marks >= 40 && marks < 50)
        ) {
          reason = `Failed Final Exam (${marks}/${100})`;
          actionTaken = 'STUDENT TO SUPPLEMENT THE EXAM';

          newSupplementaryStudents.push({
            studentId: student.stdNo,
            studentName: student.name,
            studentNumber: student.stdNo.toString(),
            marks: marks.toString(),
            grade,
            status: sm.status,
            reason,
            actionTaken,
          });
        } else {
          totalPasses++;
        }
      }
    });

    return {
      ...reportData,
      totalPasses,
      totalFailures: newFailedStudents.length,
      totalSupplementary: newSupplementaryStudents.length,
      failedStudents: newFailedStudents.sort((a, b) =>
        a.studentName.localeCompare(b.studentName),
      ),
      supplementaryStudents: newSupplementaryStudents.sort((a, b) =>
        a.studentName.localeCompare(b.studentName),
      ),
    };
  }

  private isFailingGrade(grade: string): boolean {
    return ['F', 'FX', 'X', 'FIN', 'ANN', 'DNC', 'DNA'].includes(grade);
  }

  private isSupplementaryGrade(grade: string): boolean {
    return ['Supplementary', 'PP'].includes(grade);
  }

  async getAvailableModulesForProgram(programId: number) {
    const currentTerm = await termsRepository.getActive();
    if (!currentTerm) {
      throw new Error('No active term found');
    }

    return this.repository.getAvailableModulesForProgram(
      programId,
      currentTerm.name,
    );
  }
}

export const courseSummaryService = new CourseSummaryService();
