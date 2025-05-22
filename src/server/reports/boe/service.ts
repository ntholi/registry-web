import {
  boeReportRepository,
  FacultyReport,
  ProgramSemesterReport,
  StudentSemesterReport,
} from './repository';
import { termsRepository } from '@/server/terms/repository';
import * as XLSX from 'xlsx';

interface StudentSemester {
  semesterNumber: number | null;
  studentProgram: {
    student: {
      stdNo: number;
      name: string;
    };
    structure: {
      program: {
        id: number;
        code: string;
        name: string;
      };
    };
  };
  studentModules: Array<{
    marks: string;
    grade: string;
    semesterModule: {
      credits: number;
      module: {
        code: string;
        name: string;
      };
    };
  }>;
}

export default class BoeReportService {
  private repository = boeReportRepository;
  private termsRepo = termsRepository;

  async generateBoeReportForProgram(programId: number): Promise<Buffer> {
    const currentTerm = await this.termsRepo.getActive();
    if (!currentTerm) {
      throw new Error('No active term found');
    }

    const studentSemesters =
      await this.repository.getStudentSemestersForProgram(
        programId,
        currentTerm.name,
      );

    const semesterGroups = this.groupBySemesterNumber(
      studentSemesters as StudentSemester[],
    );

    const workbook = XLSX.utils.book_new();

    for (const [semesterNumber, semesters] of Object.entries(semesterGroups)) {
      const programReport: ProgramSemesterReport = {
        programId,
        programCode: semesters[0]?.studentProgram.structure.program.code || '',
        programName: semesters[0]?.studentProgram.structure.program.name || '',
        semesterNumber: parseInt(semesterNumber),
        students: this.createStudentReports(semesters as StudentSemester[]),
      };

      const worksheet = this.createWorksheet(programReport);

      const sheetName = `${programReport.programCode}Y${Math.ceil(parseInt(semesterNumber) / 2)}S${parseInt(semesterNumber) % 2 === 0 ? 2 : 1}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  async generateBoeReportForFaculty(facultyId: number): Promise<Buffer> {
    const currentTerm = await this.termsRepo.getActive();
    if (!currentTerm) {
      throw new Error('No active term found');
    }

    const studentSemesters =
      await this.repository.getStudentSemestersForFaculty(
        facultyId,
        currentTerm.name,
      );

    const programGroups = this.groupByProgram(
      studentSemesters as StudentSemester[],
    );

    const workbook = XLSX.utils.book_new();

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
          students: this.createStudentReports(semesters as StudentSemester[]),
        };

        const worksheet = this.createWorksheet(programReport);

        const sheetName = `${programReport.programCode}Y${Math.ceil(parseInt(semesterNumber) / 2)}S${parseInt(semesterNumber) % 2 === 0 ? 2 : 1}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
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
  ): StudentSemesterReport[] {
    return semesters.map((semester) => {
      const gpa = this.calculateGPA(semester.studentModules);

      const cgpa = gpa;

      return {
        studentId: semester.studentProgram.student.stdNo,
        studentName: semester.studentProgram.student.name,
        studentModules: semester.studentModules.map((studentModule: any) => ({
          studentId: semester.studentProgram.student.stdNo,
          studentName: semester.studentProgram.student.name,
          moduleCode: studentModule.semesterModule.module.code,
          moduleName: studentModule.semesterModule.module.name,
          credits: studentModule.semesterModule.credits,
          marks: studentModule.marks,
          grade: studentModule.grade,
        })),
        gpa,
        cgpa,
      };
    });
  }

  private calculateGPA(
    studentModules: StudentSemester['studentModules'],
  ): string {
    if (studentModules.length === 0) return '0.00';

    const gradePoints: Record<string, number> = {
      'A+': 4.0,
      A: 4.0,
      'A-': 3.7,
      'B+': 3.3,
      B: 3.0,
      'B-': 2.7,
      'C+': 2.3,
      C: 2.0,
      'C-': 1.7,
      F: 0.0,
    };

    let totalPoints = 0;
    let totalCredits = 0;

    for (const module of studentModules) {
      const grade = module.grade;
      const credits = module.semesterModule.credits;

      if (gradePoints[grade] === undefined) continue;

      totalPoints += gradePoints[grade] * credits;
      totalCredits += credits;
    }

    if (totalCredits === 0) return '0.00';

    const gpa = totalPoints / totalCredits;
    return gpa.toFixed(2);
  }

  private createWorksheet(
    programReport: ProgramSemesterReport,
  ): XLSX.WorkSheet {
    const headerRows = [
      ['BOARD OF EXAMINATION'],
      ['Faculty of Information and Communication Technology'],
      [`${programReport.programName}`],
      [
        `Term: ${new Date().getFullYear()} - ${new Date().getMonth() < 6 ? 'January' : 'July'}`,
      ],
      [
        `Printing date: ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}`,
      ],
      ['By Country: Lesotho'],
      [''],
    ];

    const moduleColumns = this.getUniqueModules(programReport.students);

    const moduleHeaderRow = [
      '',
      '',
      ...moduleColumns.map((m) => m.code),
      '',
      '',
    ];

    const moduleNameRow = [
      '',
      '',
      ...moduleColumns.map((m) => m.name),
      'GPA',
      'CGPA',
      'Faculty Remark',
    ];

    const moduleCreditsRow = [
      '',
      '',
      ...moduleColumns.map((m) => m.credits.toString()),
      '',
      '',
      '',
    ];

    const studentRows = programReport.students.map((student, index) => {
      const studentData = [(index + 1).toString(), student.studentName];

      for (const moduleCol of moduleColumns) {
        const studentModule = student.studentModules.find(
          (sm) => sm.moduleCode === moduleCol.code,
        );

        if (studentModule) {
          studentData.push(`${studentModule.marks} ${studentModule.grade}`);
        } else {
          studentData.push('');
        }
      }

      studentData.push(student.gpa);
      studentData.push(student.cgpa);
      studentData.push('Proceed');

      return studentData;
    });

    const allRows = [
      ...headerRows,
      moduleHeaderRow,
      moduleNameRow,
      moduleCreditsRow,
      [
        'No',
        'Name',
        ...moduleColumns.map(() => ''),
        'GPA',
        'CGPA',
        'Faculty Remark',
      ],
      ...studentRows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(allRows);

    const colWidths = [
      { wch: 5 },
      { wch: 30 },
      ...moduleColumns.map(() => ({ wch: 15 })),
      { wch: 8 },
      { wch: 8 },
      { wch: 15 },
    ];

    worksheet['!cols'] = colWidths;

    return worksheet;
  }

  private getUniqueModules(students: StudentSemesterReport[]) {
    const moduleMap = new Map<
      string,
      { code: string; name: string; credits: number }
    >();

    for (const student of students) {
      for (const module of student.studentModules) {
        if (!moduleMap.has(module.moduleCode)) {
          moduleMap.set(module.moduleCode, {
            code: module.moduleCode,
            name: module.moduleName,
            credits: module.credits,
          });
        }
      }
    }

    return Array.from(moduleMap.values());
  }
}

export const boeReportService = new BoeReportService();
