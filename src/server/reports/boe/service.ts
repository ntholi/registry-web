import { termsRepository } from '@/server/terms/repository';
import ExcelJS from 'exceljs';
import {
  boeReportRepository,
  ProgramSemesterReport,
  StudentSemesterReport,
} from './repository';

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

    const workbook = new ExcelJS.Workbook();

    for (const [semesterNumber, semesters] of Object.entries(semesterGroups)) {
      const programReport: ProgramSemesterReport = {
        programId,
        programCode: semesters[0]?.studentProgram.structure.program.code || '',
        programName: semesters[0]?.studentProgram.structure.program.name || '',
        semesterNumber: parseInt(semesterNumber),
        students: this.createStudentReports(semesters as StudentSemester[]),
      };

      const sheetName = `${programReport.programCode}Y${Math.ceil(parseInt(semesterNumber) / 2)}S${parseInt(semesterNumber) % 2 === 0 ? 2 : 1}`;
      const worksheet = workbook.addWorksheet(sheetName);

      this.createWorksheet(worksheet, programReport);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
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
          students: this.createStudentReports(semesters as StudentSemester[]),
        };

        const sheetName = `${programReport.programCode}Y${Math.ceil(parseInt(semesterNumber) / 2)}S${parseInt(semesterNumber) % 2 === 0 ? 2 : 1}`;
        const worksheet = workbook.addWorksheet(sheetName);

        this.createWorksheet(worksheet, programReport);
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
    worksheet: ExcelJS.Worksheet,
    programReport: ProgramSemesterReport,
  ): void {
    // Configure worksheet properties
    worksheet.properties.defaultRowHeight = 20;
    worksheet.properties.defaultColWidth = 12;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const termStart = currentMonth < 6 ? 'January' : 'July';
    const termEnd = currentMonth < 6 ? 'June' : 'December';
    const termRange = `${termStart} - ${termEnd} ${currentYear}`;

    // Add header rows
    worksheet.addRow([]);
    const titleRow = worksheet.addRow(['', 'BOARD OF EXAMINATION']);
    worksheet.addRow([
      '',
      `Faculty of ${programReport.programName.split(' ')[0]}`,
    ]);
    worksheet.addRow(['', `${programReport.programName}`]);
    worksheet.addRow(['', `Term : ${termRange}`]);
    worksheet.addRow([
      '',
      `Printing date : ${currentDate.toLocaleDateString('en-GB')}, ${currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    ]);
    worksheet.addRow(['', 'By Country : Lesotho']);
    worksheet.addRow([]);

    // Get unique modules for this program/semester
    const moduleColumns = this.getUniqueModules(programReport.students);

    // Create column headers
    const headerRow = worksheet.addRow(['No', 'Name', 'StudentID', 'Status']);

    // Add module code headers
    moduleColumns.forEach((module) => {
      headerRow.getCell(headerRow.cellCount + 1).value = module.code;
      headerRow.getCell(headerRow.cellCount + 1).value = ''; // Empty cell for merging
    });

    // Add GPA, CGPA, and Faculty Remark headers
    headerRow.getCell(headerRow.cellCount + 1).value = 'GPA';
    headerRow.getCell(headerRow.cellCount + 1).value = 'CGPA';
    headerRow.getCell(headerRow.cellCount + 1).value = 'Faculty Remark';

    // Add Mk/Gr subheaders
    const subHeaderRow = worksheet.addRow(['', '', '', '']);
    moduleColumns.forEach(() => {
      subHeaderRow.getCell(subHeaderRow.cellCount + 1).value = 'Mk';
      subHeaderRow.getCell(subHeaderRow.cellCount + 1).value = 'Gr';
    });

    // Add module names
    const moduleNameRow = worksheet.addRow(['', '', '', '']);
    moduleColumns.forEach((module) => {
      moduleNameRow.getCell(moduleNameRow.cellCount + 1).value = module.name;
      moduleNameRow.getCell(moduleNameRow.cellCount + 1).value = ''; // Empty cell for merging
    });

    // Add student data rows
    programReport.students.forEach((student, index) => {
      const studentRow = worksheet.addRow([
        index + 1,
        student.studentName,
        student.studentId.toString(),
        'Active', // Assuming all students are active
      ]);

      // Add module marks and grades
      moduleColumns.forEach((moduleCol) => {
        const studentModule = student.studentModules.find(
          (sm) => sm.moduleCode === moduleCol.code,
        );

        if (studentModule) {
          studentRow.getCell(studentRow.cellCount + 1).value =
            studentModule.marks;
          studentRow.getCell(studentRow.cellCount + 1).value =
            studentModule.grade;
        } else {
          studentRow.getCell(studentRow.cellCount + 1).value = '';
          studentRow.getCell(studentRow.cellCount + 1).value = '';
        }
      });

      // Add GPA, CGPA and Faculty Remark
      studentRow.getCell(studentRow.cellCount + 1).value = student.gpa;
      studentRow.getCell(studentRow.cellCount + 1).value = student.cgpa;
      studentRow.getCell(studentRow.cellCount + 1).value = 'Proceed';
    });

    // Set column widths
    worksheet.getColumn(1).width = 5; // No
    worksheet.getColumn(2).width = 30; // Name
    worksheet.getColumn(3).width = 15; // StudentID
    worksheet.getColumn(4).width = 10; // Status

    // Set module column widths
    let colIndex = 5;
    moduleColumns.forEach(() => {
      worksheet.getColumn(colIndex++).width = 8; // Marks
      worksheet.getColumn(colIndex++).width = 5; // Grade
    });

    // Set GPA, CGPA, and Faculty Remark column widths
    worksheet.getColumn(colIndex++).width = 8; // GPA
    worksheet.getColumn(colIndex++).width = 8; // CGPA
    worksheet.getColumn(colIndex++).width = 15; // Faculty Remark

    // Style the header rows
    titleRow.getCell(2).font = { bold: true, size: 14 };
    titleRow.getCell(2).alignment = { horizontal: 'center' };

    // Merge header cells
    worksheet.mergeCells(2, 2, 2, 10); // Title row
    worksheet.mergeCells(3, 2, 3, 10); // Faculty row
    worksheet.mergeCells(4, 2, 4, 10); // Program row
    worksheet.mergeCells(5, 2, 5, 10); // Term row
    worksheet.mergeCells(6, 2, 6, 10); // Printing date row
    worksheet.mergeCells(7, 2, 7, 10); // Country row

    // Merge module code cells
    colIndex = 5;
    moduleColumns.forEach(() => {
      worksheet.mergeCells(9, colIndex, 9, colIndex + 1);
      worksheet.mergeCells(11, colIndex, 11, colIndex + 1);
      colIndex += 2;
    });

    // Add borders to all cells
    for (let i = 9; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      for (let j = 1; j <= row.cellCount; j++) {
        const cell = row.getCell(j);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        // Center align all cells except student names
        if (j !== 2) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      }
    }
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
