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
        studentModules: semester.studentModules.map((studentModule) => ({
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

    for (const it of studentModules) {
      const grade = it.grade;
      const credits = it.semesterModule.credits;

      if (gradePoints[grade] === undefined) continue;

      totalPoints += gradePoints[grade] * credits;
      totalCredits += credits;
    }

    if (totalCredits === 0) return '0.00';

    const gpa = totalPoints / totalCredits;
    return gpa.toFixed(2);
  }

  private getColumnLetter(col: number): string {
    let letter = '';
    while (col > 0) {
      const mod = (col - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      col = Math.floor((col - 1) / 26);
    }
    return letter;
  }

  private createWorksheet(
    worksheet: ExcelJS.Worksheet,
    programReport: ProgramSemesterReport,
  ): void {
    const currentDate = new Date();

    const dateStr = currentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = currentDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow(['BOARD OF EXAMINATION']);

    const facultyName = programReport.programName.includes('Architecture')
      ? 'Architecture and the Built Environment'
      : programReport.programName.split(' ')[0];
    worksheet.addRow([`Faculty of ${facultyName}`]);

    worksheet.addRow([`Diploma in ${programReport.programName}`]);
    worksheet.addRow([`Term : July - December 2024`]);
    worksheet.addRow([`Printing date : ${dateStr}, ${timeStr}`]);
    worksheet.addRow([`By Country : Lesotho`]);
    worksheet.addRow([]);

    const moduleColumns = this.getUniqueModules(programReport.students);

    const dataStartRow = 11;
    const headerRow = worksheet.getRow(dataStartRow);
    headerRow.getCell(1).value = 'No';
    headerRow.getCell(2).value = 'Name';
    headerRow.getCell(3).value = 'StudentID';
    headerRow.getCell(4).value = 'Status';

    let colIndex = 5;
    moduleColumns.forEach((module) => {
      headerRow.getCell(colIndex).value = module.code;
      colIndex += 2;
    });

    headerRow.getCell(colIndex).value = 'GPA';
    headerRow.getCell(colIndex + 1).value = 'CGPA';
    headerRow.getCell(colIndex + 2).value = 'Faculty Remark';

    const subHeaderRow = worksheet.getRow(dataStartRow + 1);
    subHeaderRow.getCell(1).value = '';
    subHeaderRow.getCell(2).value = '';
    subHeaderRow.getCell(3).value = '';
    subHeaderRow.getCell(4).value = '';

    colIndex = 5;
    moduleColumns.forEach(() => {
      subHeaderRow.getCell(colIndex).value = 'Mk';
      subHeaderRow.getCell(colIndex + 1).value = 'Gr';
      colIndex += 2;
    });

    subHeaderRow.getCell(colIndex).value = '';
    subHeaderRow.getCell(colIndex + 1).value = '';
    subHeaderRow.getCell(colIndex + 2).value = '';

    const moduleNameRow = worksheet.getRow(dataStartRow + 2);
    moduleNameRow.getCell(1).value = '';
    moduleNameRow.getCell(2).value = '';
    moduleNameRow.getCell(3).value = '';
    moduleNameRow.getCell(4).value = '';

    colIndex = 5;
    moduleColumns.forEach((module) => {
      const nameCell = moduleNameRow.getCell(colIndex);
      nameCell.value = module.name;
      nameCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      colIndex += 2;
    });

    moduleNameRow.height = 40;

    programReport.students.forEach((student, index) => {
      const rowIndex = dataStartRow + 3 + index;
      const studentRow = worksheet.getRow(rowIndex);

      studentRow.getCell(1).value = index + 1;
      studentRow.getCell(2).value = student.studentName;
      studentRow.getCell(3).value = student.studentId;
      studentRow.getCell(4).value = 'Active';

      colIndex = 5;
      moduleColumns.forEach((moduleCol) => {
        const studentModule = student.studentModules.find(
          (sm) => sm.moduleCode === moduleCol.code,
        );

        if (studentModule) {
          const marks = parseFloat(studentModule.marks);
          studentRow.getCell(colIndex).value = isNaN(marks)
            ? studentModule.marks
            : marks;
          studentRow.getCell(colIndex + 1).value = studentModule.grade;
        } else {
          studentRow.getCell(colIndex).value = '-';
          studentRow.getCell(colIndex + 1).value = '';
        }
        colIndex += 2;
      });

      const gpaValue = parseFloat(student.gpa);
      const cgpaValue = parseFloat(student.cgpa);

      studentRow.getCell(colIndex).value = isNaN(gpaValue)
        ? student.gpa
        : gpaValue;
      studentRow.getCell(colIndex + 1).value = isNaN(cgpaValue)
        ? student.cgpa
        : cgpaValue;
      studentRow.getCell(colIndex + 2).value = '';
    });

    worksheet.getColumn(1).width = 4;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 12;
    worksheet.getColumn(4).width = 8;

    colIndex = 5;
    moduleColumns.forEach(() => {
      worksheet.getColumn(colIndex).width = 6;
      worksheet.getColumn(colIndex + 1).width = 4;
      colIndex += 2;
    });

    worksheet.getColumn(colIndex).width = 6;
    worksheet.getColumn(colIndex + 1).width = 6;
    worksheet.getColumn(colIndex + 2).width = 6;

    worksheet.getCell('A4').font = { bold: true, size: 12 };
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    const lastCol = 4 + moduleColumns.length * 2 + 3;
    const endColLetter = this.getColumnLetter(lastCol);

    worksheet.mergeCells(`A4:${endColLetter}4`);
    worksheet.mergeCells(`A5:${endColLetter}5`);
    worksheet.mergeCells(`A6:${endColLetter}6`);
    worksheet.mergeCells(`A7:${endColLetter}7`);
    worksheet.mergeCells(`A8:${endColLetter}8`);
    worksheet.mergeCells(`A9:${endColLetter}9`);

    colIndex = 5;
    moduleColumns.forEach(() => {
      const startCol = this.getColumnLetter(colIndex);
      const endCol = this.getColumnLetter(colIndex + 1);
      worksheet.mergeCells(
        `${startCol}${dataStartRow}:${endCol}${dataStartRow}`,
      );
      worksheet.mergeCells(
        `${startCol}${dataStartRow + 2}:${endCol}${dataStartRow + 2}`,
      );
      colIndex += 2;
    });

    const totalRows = dataStartRow + 2 + programReport.students.length;
    for (let i = dataStartRow; i <= totalRows; i++) {
      const row = worksheet.getRow(i);
      for (let j = 1; j <= lastCol; j++) {
        const cell = row.getCell(j);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (j !== 2) {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
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
      for (const it of student.studentModules) {
        if (!moduleMap.has(it.moduleCode)) {
          moduleMap.set(it.moduleCode, {
            code: it.moduleCode,
            name: it.moduleName,
            credits: it.credits,
          });
        }
      }
    }

    return Array.from(moduleMap.values());
  }
}

export const boeReportService = new BoeReportService();
