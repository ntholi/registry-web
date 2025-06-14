import { termsRepository } from '@/server/terms/repository';
import { summarizeModules, calculateGPA, getGradePoints } from '@/utils/grades';
import { ModuleStatus } from '@/db/schema';
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
    status: string;
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

  async generateBoeReportForProgram(programId: number): Promise<Buffer> {
    const currentTerm = await termsRepository.getActive();
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
    const currentTerm = await termsRepository.getActive();
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

  private createStudentReports(semesters: StudentSemester[]) {
    return semesters.map((semester) => {
      const summary = summarizeModules(
        semester.studentModules.map((sm) => ({
          grade: sm.grade,
          credits: Number(sm.semesterModule.credits),
          status: sm.status as ModuleStatus,
        })),
      );

      const gpa = summary.gpa.toFixed(2);
      const cgpa = calculateGPA(
        summary.points,
        summary.creditsAttempted,
      ).toFixed(2);

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
        modulesCount: semester.studentModules.length,
        creditsAttempted: summary.creditsAttempted,
        creditsEarned: summary.creditsCompleted,
        totalPoints: summary.points,
        gpa,
        cgpa,
      };
    });
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

    // Top header rows
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow(['BOARD OF EXAMINATION']);

    const facultyName = programReport.programName.includes('Architecture')
      ? 'Architecture and the Built Environment'
      : programReport.programName.split(' ')[0];
    worksheet.addRow([`Faculty of ${facultyName}`]);
    worksheet.addRow([`Diploma in ${programReport.programName}`]);
    worksheet.addRow(['Term : July - December 2024']);
    worksheet.addRow([`Printing date : ${dateStr}, ${timeStr}`]);
    worksheet.addRow(['By Country : Lesotho']);
    const programSemesterLabel = `${programReport.programCode}Y${Math.ceil(programReport.semesterNumber / 2)}S${programReport.semesterNumber % 2 === 0 ? 2 : 1}`;
    worksheet.addRow([programSemesterLabel]);
    worksheet.addRow([]);

    worksheet.getCell('A4').font = { bold: true, size: 12 };
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    const moduleColumns = this.getUniqueModules(programReport.students);

    const headerStartRow = worksheet.lastRow!.number + 1; // usually 11
    const programCodeRowIndex = headerStartRow - 2;
    const nameRow = worksheet.getRow(headerStartRow);
    const creditsRow = worksheet.getRow(headerStartRow + 1);
    const codeRow = worksheet.getRow(headerStartRow + 2);
    const subHeaderRow = worksheet.getRow(headerStartRow + 3);

    // Sub header (column labels)
    subHeaderRow.getCell(1).value = 'No';
    subHeaderRow.getCell(2).value = 'Name';
    subHeaderRow.getCell(3).value = 'StudentID';
    subHeaderRow.getCell(4).value = 'Status';

    // Placeholders for other header rows
    [nameRow, creditsRow, codeRow].forEach((row) => {
      row.getCell(1).value = '';
      row.getCell(2).value = '';
      row.getCell(3).value = '';
      row.getCell(4).value = '';
    });

    let colIndex = 5;
    moduleColumns.forEach((module) => {
      // Module Name row
      const nameCell = nameRow.getCell(colIndex);
      nameCell.value = module.name;
      nameCell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };

      // Credits row
      creditsRow.getCell(colIndex).value = module.credits;

      // Code row
      codeRow.getCell(colIndex).value = module.code;

      // Sub header row labels
      subHeaderRow.getCell(colIndex).value = 'Mk';
      subHeaderRow.getCell(colIndex + 1).value = 'Gr';
      subHeaderRow.getCell(colIndex + 2).value = 'Pt';

      colIndex += 3;
    });

    // Extra summary headers after module columns
    subHeaderRow.getCell(colIndex).value = 'No. of Module(s)';
    subHeaderRow.getCell(colIndex + 1).value = 'Credits Attempted';
    subHeaderRow.getCell(colIndex + 2).value = 'Credits Earned';
    subHeaderRow.getCell(colIndex + 3).value = 'Total Points Earned';
    subHeaderRow.getCell(colIndex + 4).value = 'GPA';
    subHeaderRow.getCell(colIndex + 5).value = 'CGPA';
    subHeaderRow.getCell(colIndex + 6).value = 'Faculty Remark';

    // Adjust heights
    nameRow.height = 40;

    // Student data rows
    const studentStartRow = headerStartRow + 4;

    programReport.students.forEach((student, index) => {
      const studentRow = worksheet.getRow(studentStartRow + index);
      studentRow.getCell(1).value = index + 1;
      studentRow.getCell(2).value = student.studentName;
      studentRow.getCell(3).value = student.studentId;
      studentRow.getCell(4).value = 'Active';

      colIndex = 5;
      moduleColumns.forEach((moduleCol) => {
        const studentModule = student.studentModules.find(
          (sm) => sm.moduleCode === moduleCol.code,
        );

        let marksDisplay: number | string = '-';
        let gradeDisplay = '';
        let pointsDisplay: number | string = '';

        if (studentModule) {
          const marksNum = parseFloat(studentModule.marks);
          marksDisplay = isNaN(marksNum) ? studentModule.marks : marksNum;
          gradeDisplay = studentModule.grade;
          const gpaValue = getGradePoints(studentModule.grade);
          const pts = gpaValue * studentModule.credits;
          pointsDisplay = isNaN(pts) ? '' : Number(pts.toFixed(2));
        }

        studentRow.getCell(colIndex).value = marksDisplay;
        studentRow.getCell(colIndex + 1).value = gradeDisplay;
        studentRow.getCell(colIndex + 2).value = pointsDisplay;

        colIndex += 3;
      });

      studentRow.getCell(colIndex).value = student.modulesCount;
      studentRow.getCell(colIndex + 1).value = student.creditsAttempted;
      studentRow.getCell(colIndex + 2).value = student.creditsEarned;
      studentRow.getCell(colIndex + 3).value = student.totalPoints;

      const gpaVal = parseFloat(student.gpa);
      const cgpaVal = parseFloat(student.cgpa);

      studentRow.getCell(colIndex + 4).value = isNaN(gpaVal)
        ? student.gpa
        : gpaVal;
      studentRow.getCell(colIndex + 5).value = isNaN(cgpaVal)
        ? student.cgpa
        : cgpaVal;
      const hasFail = student.studentModules.some((sm) =>
        ['F', 'X', 'GNS', 'ANN', 'FIN', 'FX', 'DNC', 'DNA', 'DNS'].includes(
          sm.grade,
        ),
      );
      studentRow.getCell(colIndex + 6).value = hasFail
        ? 'Probation'
        : 'Proceed';
    });

    // Column widths
    worksheet.getColumn(1).width = 4;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 12;
    worksheet.getColumn(4).width = 8;

    colIndex = 5;
    moduleColumns.forEach(() => {
      worksheet.getColumn(colIndex).width = 6;
      worksheet.getColumn(colIndex + 1).width = 4;
      worksheet.getColumn(colIndex + 2).width = 6;
      colIndex += 3;
    });

    worksheet.getColumn(colIndex).width = 6; // Modules count
    worksheet.getColumn(colIndex + 1).width = 6; // Credits attempted
    worksheet.getColumn(colIndex + 2).width = 6; // Credits earned
    worksheet.getColumn(colIndex + 3).width = 10; // Total points earned
    worksheet.getColumn(colIndex + 4).width = 6; // GPA
    worksheet.getColumn(colIndex + 5).width = 6; // CGPA
    worksheet.getColumn(colIndex + 6).width = 12; // Faculty remark

    // Merge cells for headers
    const lastCol = 4 + moduleColumns.length * 3 + 7;
    worksheet.getColumn(lastCol).width = 12; // Faculty remark
    const endColLetter = this.getColumnLetter(lastCol);

    worksheet.mergeCells(`A4:${endColLetter}4`);
    worksheet.mergeCells(`A5:${endColLetter}5`);
    worksheet.mergeCells(`A6:${endColLetter}6`);
    worksheet.mergeCells(`A7:${endColLetter}7`);
    worksheet.mergeCells(`A8:${endColLetter}8`);
    worksheet.mergeCells(`A9:${endColLetter}9`);
    worksheet.mergeCells(
      `A${programCodeRowIndex}:${endColLetter}${programCodeRowIndex}`,
    );
    worksheet.getRow(programCodeRowIndex).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    // Merge module blocks across header rows
    colIndex = 5;
    moduleColumns.forEach(() => {
      const startCol = this.getColumnLetter(colIndex);
      const endCol = this.getColumnLetter(colIndex + 2);
      [headerStartRow, headerStartRow + 1, headerStartRow + 2].forEach((r) => {
        worksheet.mergeCells(`${startCol}${r}:${endCol}${r}`);
      });
      colIndex += 3;
    });

    // Apply borders and alignment
    const totalRows = studentStartRow + programReport.students.length;
    for (let r = headerStartRow; r <= totalRows; r++) {
      const row = worksheet.getRow(r);
      for (let c = 1; c <= lastCol; c++) {
        const cell = row.getCell(c);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (c !== 2) {
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          };
        } else {
          cell.alignment = {
            horizontal: 'left',
            vertical: 'middle',
            wrapText: true,
          };
        }
      }
    }
  }
}

export const boeReportService = new BoeReportService();
