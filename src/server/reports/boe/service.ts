import { ModuleStatus, schools } from '@/db/schema';
import { termsRepository } from '@/server/terms/repository';
import {
  getGradePoints,
  isFailingGrade,
  summarizeModules,
} from '@/utils/grades';
import ExcelJS from 'exceljs';
import {
  boeReportRepository,
  ProgramSemesterReport,
  StudentSemesterReport,
} from './repository';

type School = typeof schools.$inferSelect;

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
            currentTerm.name,
          ),
        };

        const year = Math.ceil(parseInt(semesterNumber) / 2);
        const semester = parseInt(semesterNumber) % 2 === 0 ? 2 : 1;
        const sheetName = `${programReport.programCode}Y${year}S${semester}`;
        const worksheet = workbook.addWorksheet(sheetName);

        this.createWorksheet(
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
    currentTerm: string,
  ) {
    return semesters.map((semester) => {
      const studentId = semester.studentProgram.student.stdNo;
      const studentSemesters = allStudentSemesters.filter(
        (s) => s.studentProgram.student.stdNo === studentId,
      );

      const allModules = studentSemesters.flatMap((s) => s.studentModules);
      const currentModules = semester.studentModules;

      const summary = summarizeModules(
        allModules.map((sm) => ({
          grade: sm.grade,
          credits: Number(sm.semesterModule.credits),
          status: (sm.status as ModuleStatus) || 'Active',
        })),
      );

      const currentSemesterSummary = summarizeModules(
        currentModules.map((sm) => ({
          grade: sm.grade,
          credits: Number(sm.semesterModule.credits),
          status: (sm.status as ModuleStatus) || 'Active',
        })),
      );

      const gpa = currentSemesterSummary.gpa.toFixed(2);
      const cgpa = summary.gpa.toFixed(2);

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
        creditsAttempted: currentSemesterSummary.creditsAttempted,
        creditsEarned: currentSemesterSummary.creditsCompleted,
        totalPoints: currentSemesterSummary.points,
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
    schoolName: string,
    termName: string,
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

    const moduleColumns = this.getUniqueModules(programReport.students);
    const totalCols = 4 + moduleColumns.length * 3 + 7; // Base cols + modules (3 cols each) + summary cols
    const endColLetter = this.getColumnLetter(totalCols);

    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);

    const boardRow = worksheet.addRow(['BOARD OF EXAMINATION']);
    worksheet.mergeCells(`A4:${endColLetter}4`);
    worksheet.getCell('A4').font = { bold: true, size: 12 };
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    const row5 = worksheet.addRow([schoolName]);

    let colIndex = 5;
    moduleColumns.forEach((module) => {
      row5.getCell(colIndex).value = module.name;
      row5.getCell(colIndex).alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      colIndex += 3; // Skip 3 columns for Mk, Gr, Pt
    });

    const summaryStartCol = colIndex;
    row5.getCell(colIndex++).value = 'No. of Module(s)';
    row5.getCell(colIndex++).value = 'Credits Attempted';
    row5.getCell(colIndex++).value = 'Credits Earned';
    row5.getCell(colIndex++).value = 'Total Points Earned';
    row5.getCell(colIndex++).value = 'GPA';
    row5.getCell(colIndex++).value = 'CGPA';
    row5.getCell(colIndex++).value = 'Faculty Remark';

    for (let i = summaryStartCol; i < colIndex; i++) {
      row5.getCell(i).alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
    }

    worksheet.addRow([programReport.programName]);
    worksheet.addRow([`Term : ${termName}`]);
    worksheet.addRow([`Printing date : ${dateStr}, ${timeStr}`]);
    worksheet.addRow(['By Country : Lesotho']);

    const programSemesterLabel = `${programReport.programCode}Y${Math.ceil(programReport.semesterNumber / 2)}S${programReport.semesterNumber % 2 === 0 ? 2 : 1}`;
    const row10 = worksheet.addRow([programSemesterLabel]);

    colIndex = 5;
    moduleColumns.forEach((module) => {
      row10.getCell(colIndex).value = module.code;
      row10.getCell(colIndex).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      colIndex += 3; // Skip 3 columns for Mk, Gr, Pt
    });

    const row11 = worksheet.addRow([]);

    colIndex = 5;
    moduleColumns.forEach((module) => {
      row11.getCell(colIndex).value = module.credits;
      row11.getCell(colIndex).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      colIndex += 3; // Skip 3 columns for Mk, Gr, Pt
    });

    const headerRow = worksheet.addRow(['No', 'Name', 'StudentID', 'Status']);

    // Add Mk, Gr, Pt headers for each module
    colIndex = 5;
    moduleColumns.forEach(() => {
      headerRow.getCell(colIndex).value = 'Mk';
      headerRow.getCell(colIndex + 1).value = 'Gr';
      headerRow.getCell(colIndex + 2).value = 'Pt';
      colIndex += 3;
    });

    const studentStartRow = 13;

    programReport.students.forEach((student, index) => {
      const studentRow = worksheet.addRow([
        index + 1,
        student.studentName,
        student.studentId,
        'Active',
      ]);

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
        if (marksDisplay === '-') {
          worksheet.mergeCells(
            studentRow.number,
            colIndex,
            studentRow.number,
            colIndex + 2,
          );
          studentRow.getCell(colIndex).value = '-';
          studentRow.getCell(colIndex).alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
        } else {
          studentRow.getCell(colIndex).value = marksDisplay;
          studentRow.getCell(colIndex + 1).value = gradeDisplay;
          studentRow.getCell(colIndex + 2).value = pointsDisplay;

          studentRow.getCell(colIndex).alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          studentRow.getCell(colIndex + 1).alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          studentRow.getCell(colIndex + 2).alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
        }

        colIndex += 3;
      });

      // Add summary data
      studentRow.getCell(colIndex++).value = student.modulesCount;
      studentRow.getCell(colIndex++).value = student.creditsAttempted;
      studentRow.getCell(colIndex++).value = student.creditsEarned;
      studentRow.getCell(colIndex++).value = student.totalPoints;

      const gpaVal = parseFloat(student.gpa);
      const cgpaVal = parseFloat(student.cgpa);

      studentRow.getCell(colIndex++).value = isNaN(gpaVal)
        ? student.gpa
        : gpaVal;
      studentRow.getCell(colIndex++).value = isNaN(cgpaVal)
        ? student.cgpa
        : cgpaVal;

      const hasFail = student.studentModules.some((sm) =>
        isFailingGrade(sm.grade),
      );
      studentRow.getCell(colIndex++).value = hasFail ? 'Probation' : 'Proceed';
    });

    const longestName = programReport.students.reduce((longest, student) => {
      return student.studentName.length > longest.length
        ? student.studentName
        : longest;
    }, '');
    const nameColumnWidth = Math.max(longestName.length * 1.1, 25); // 1.1 multiplier for padding, minimum 25

    worksheet.getColumn(1).width = 4; // No
    worksheet.getColumn(2).width = nameColumnWidth; // Name - dynamic width
    worksheet.getColumn(3).width = 12; // StudentID
    worksheet.getColumn(4).width = 8; // Status

    colIndex = 5;
    moduleColumns.forEach(() => {
      worksheet.getColumn(colIndex).width = 6; // Mk
      worksheet.getColumn(colIndex + 1).width = 4; // Gr
      worksheet.getColumn(colIndex + 2).width = 6; // Pt
      colIndex += 3;
    });

    worksheet.getColumn(colIndex++).width = 8; // No. of Module(s)
    worksheet.getColumn(colIndex++).width = 8; // Credits Attempted
    worksheet.getColumn(colIndex++).width = 8; // Credits Earned
    worksheet.getColumn(colIndex++).width = 10; // Total Points Earned
    worksheet.getColumn(colIndex++).width = 6; // GPA
    worksheet.getColumn(colIndex++).width = 6; // CGPA
    worksheet.getColumn(colIndex++).width = 12; // Faculty Remark

    worksheet.mergeCells('A5:D5'); // Faculty
    worksheet.mergeCells('A6:D6'); // Program
    worksheet.mergeCells('A7:D7'); // Term
    worksheet.mergeCells('A8:D8'); // Printing date
    worksheet.mergeCells('A9:D9'); // Country
    worksheet.mergeCells('A10:D10'); // Program code
    worksheet.mergeCells('A11:D11'); // Empty row

    colIndex = 5;
    moduleColumns.forEach(() => {
      const startCol = this.getColumnLetter(colIndex);
      const endCol = this.getColumnLetter(colIndex + 2);

      // Module name spans vertically from row 5 to row 9 and horizontally across all 3 columns
      worksheet.mergeCells(`${startCol}5:${endCol}9`);
      // Module code spans horizontally across all 3 columns (row 10)
      worksheet.mergeCells(`${startCol}10:${endCol}10`);
      // Module credits spans horizontally across all 3 columns (row 11)
      worksheet.mergeCells(`${startCol}11:${endCol}11`);

      colIndex += 3;
    });

    const summaryHeaders = [
      'No. of Module(s)',
      'Credits Attempted',
      'Credits Earned',
      'Total Points Earned',
      'GPA',
      'CGPA',
      'Faculty Remark',
    ];

    summaryHeaders.forEach(() => {
      const col = this.getColumnLetter(colIndex);
      worksheet.mergeCells(`${col}5:${col}11`);
      colIndex++;
    });

    worksheet.getRow(5).height = 25; // Module names row
    worksheet.getRow(6).height = 20;
    worksheet.getRow(7).height = 20;
    worksheet.getRow(8).height = 20;
    worksheet.getRow(9).height = 20;
    worksheet.getRow(10).height = 20;
    worksheet.getRow(11).height = 20;
    worksheet.getRow(12).height = 25; // Header row

    const totalRows = studentStartRow + programReport.students.length - 1;

    for (let r = 12; r <= totalRows; r++) {
      const row = worksheet.getRow(r);
      for (let c = 1; c <= totalCols; c++) {
        const cell = row.getCell(c);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        // Alignment
        if (c === 2) {
          cell.alignment = {
            horizontal: 'left',
            vertical: 'middle',
            wrapText: true,
          };
        } else {
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          };
        }
      }
    }

    const headerRowObj = worksheet.getRow(12);
    for (let c = 1; c <= totalCols; c++) {
      const cell = headerRowObj.getCell(c);
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    [5, 6, 7, 8, 9, 10, 11].forEach((rowNum) => {
      const row = worksheet.getRow(rowNum);
      for (let c = 5; c <= 4 + moduleColumns.length * 3; c++) {
        const cell = row.getCell(c);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    });

    moduleColumns.forEach((_, idx) => {
      const startCol = 5 + idx * 3;
      const endCol = startCol + 2;

      for (let c = startCol; c <= endCol; c++) {
        const topCell = worksheet.getRow(5).getCell(c);
        topCell.border = { ...topCell.border, top: { style: 'medium' } };

        const bottomCell = worksheet.getRow(totalRows).getCell(c);
        bottomCell.border = {
          ...bottomCell.border,
          bottom: { style: 'medium' },
        };
      }

      // Left and right borders spanning from row 5 down to last data row
      for (let r = 5; r <= totalRows; r++) {
        const leftCell = worksheet.getRow(r).getCell(startCol);
        leftCell.border = { ...leftCell.border, left: { style: 'medium' } };

        const rightCell = worksheet.getRow(r).getCell(endCol);
        rightCell.border = { ...rightCell.border, right: { style: 'medium' } };
      }
    });

    const summaryEndCol = summaryStartCol + summaryHeaders.length - 1;
    for (let c = summaryStartCol; c <= summaryEndCol; c++) {
      for (let r = 5; r <= 11; r++) {
        const cell = worksheet.getRow(r).getCell(c);
        cell.border = {
          ...cell.border,
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }

    for (let r = 5; r <= 10; r++) {
      for (let c = 1; c <= 4; c++) {
        const cell = worksheet.getRow(r).getCell(c);
        const newBorder: Partial<ExcelJS.Borders> = { ...cell.border };
        if (r === 5) newBorder.top = { style: 'thin' };
        if (r === 10) newBorder.bottom = { style: 'thin' };
        if (c === 1) newBorder.left = { style: 'thin' };
        if (c === 4) newBorder.right = { style: 'thin' };
        cell.border = newBorder;
      }
    }

    const contentStartRow = 5;
    for (let c = 1; c <= totalCols; c++) {
      const topCell = worksheet.getRow(contentStartRow).getCell(c);
      topCell.border = { ...topCell.border, top: { style: 'thick' } };

      const bottomCell = worksheet.getRow(totalRows).getCell(c);
      bottomCell.border = {
        ...bottomCell.border,
        bottom: { style: 'thick' },
      };
    }

    for (let r = contentStartRow; r <= totalRows; r++) {
      const leftCell = worksheet.getRow(r).getCell(1);
      leftCell.border = { ...leftCell.border, left: { style: 'thick' } };

      const rightCell = worksheet.getRow(r).getCell(totalCols);
      rightCell.border = { ...rightCell.border, right: { style: 'thick' } };
    }
  }
}

export const boeReportService = new BoeReportService();
