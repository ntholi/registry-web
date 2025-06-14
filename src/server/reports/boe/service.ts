import { termsRepository } from '@/server/terms/repository';
import { summarizeModules, calculateGPA, getGradePoints } from '@/utils/grades';
import { ModuleStatus, schools } from '@/db/schema';
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

    // Header setup - compact layout
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Row 4: BOARD OF EXAMINATION (merged across all columns)
    const boardRow = worksheet.addRow(['BOARD OF EXAMINATION']);
    worksheet.mergeCells(`A4:${endColLetter}4`);
    worksheet.getCell('A4').font = { bold: true, size: 12 };
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    const row5 = worksheet.addRow([schoolName]);

    // Add module names to row 5 starting from column 5
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

    // Add summary headers to row 5
    const summaryStartCol = colIndex;
    row5.getCell(colIndex++).value = 'No. of Module(s)';
    row5.getCell(colIndex++).value = 'Credits Attempted';
    row5.getCell(colIndex++).value = 'Credits Earned';
    row5.getCell(colIndex++).value = 'Total Points Earned';
    row5.getCell(colIndex++).value = 'GPA';
    row5.getCell(colIndex++).value = 'CGPA';
    row5.getCell(colIndex++).value = 'Faculty Remark';

    // Set alignment for summary headers
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

    // Row 10: Program/Semester code and module codes
    const programSemesterLabel = `${programReport.programCode}Y${Math.ceil(programReport.semesterNumber / 2)}S${programReport.semesterNumber % 2 === 0 ? 2 : 1}`;
    const row10 = worksheet.addRow([programSemesterLabel]);

    // Add module codes to row 10
    colIndex = 5;
    moduleColumns.forEach((module) => {
      row10.getCell(colIndex + 1).value = module.code; // Put code in middle column
      row10.getCell(colIndex + 1).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      colIndex += 3; // Skip 3 columns for Mk, Gr, Pt
    });

    // Row 11: Module credits
    const row11 = worksheet.addRow([]);
    colIndex = 5;
    moduleColumns.forEach((module) => {
      row11.getCell(colIndex + 1).value = module.credits; // Put credits in middle column
      row11.getCell(colIndex + 1).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      colIndex += 3; // Skip 3 columns for Mk, Gr, Pt
    });

    // Row 12: Column headers including Mk, Gr, Pt
    const headerRow = worksheet.addRow(['No', 'Name', 'StudentID', 'Status']);

    // Add Mk, Gr, Pt headers for each module
    colIndex = 5;
    moduleColumns.forEach(() => {
      headerRow.getCell(colIndex).value = 'Mk';
      headerRow.getCell(colIndex + 1).value = 'Gr';
      headerRow.getCell(colIndex + 2).value = 'Pt';
      colIndex += 3;
    });

    // Student data rows start from row 13
    const studentStartRow = 13;

    programReport.students.forEach((student, index) => {
      const studentRow = worksheet.addRow([
        index + 1,
        student.studentName,
        student.studentId,
        'Active',
      ]);

      // Add module grades/marks
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
        ['F', 'X', 'GNS', 'ANN', 'FIN', 'FX', 'DNC', 'DNA', 'DNS'].includes(
          sm.grade,
        ),
      );
      studentRow.getCell(colIndex++).value = hasFail ? 'Probation' : 'Proceed';
    }); // Calculate the width for the name column based on the longest name
    const longestName = programReport.students.reduce((longest, student) => {
      return student.studentName.length > longest.length
        ? student.studentName
        : longest;
    }, '');
    const nameColumnWidth = Math.max(longestName.length * 1.1, 25); // 1.1 multiplier for padding, minimum 25

    // Set column widths
    worksheet.getColumn(1).width = 4; // No
    worksheet.getColumn(2).width = nameColumnWidth; // Name - dynamic width
    worksheet.getColumn(3).width = 12; // StudentID
    worksheet.getColumn(4).width = 8; // Status

    // Module columns
    colIndex = 5;
    moduleColumns.forEach(() => {
      worksheet.getColumn(colIndex).width = 6; // Mk
      worksheet.getColumn(colIndex + 1).width = 4; // Gr
      worksheet.getColumn(colIndex + 2).width = 6; // Pt
      colIndex += 3;
    });

    // Summary columns
    worksheet.getColumn(colIndex++).width = 8; // No. of Module(s)
    worksheet.getColumn(colIndex++).width = 8; // Credits Attempted
    worksheet.getColumn(colIndex++).width = 8; // Credits Earned
    worksheet.getColumn(colIndex++).width = 10; // Total Points Earned
    worksheet.getColumn(colIndex++).width = 6; // GPA
    worksheet.getColumn(colIndex++).width = 6; // CGPA
    worksheet.getColumn(colIndex++).width = 12; // Faculty Remark

    // Merge cells for program info (left side)
    worksheet.mergeCells('A5:D5'); // Faculty
    worksheet.mergeCells('A6:D6'); // Program
    worksheet.mergeCells('A7:D7'); // Term
    worksheet.mergeCells('A8:D8'); // Printing date
    worksheet.mergeCells('A9:D9'); // Country
    worksheet.mergeCells('A10:D10'); // Program code
    worksheet.mergeCells('A11:D11'); // Empty row

    // Merge module blocks - module names span vertically from row 5 to row 11
    colIndex = 5;
    moduleColumns.forEach(() => {
      const startCol = this.getColumnLetter(colIndex);
      const endCol = this.getColumnLetter(colIndex + 2);

      // Module name spans vertically from row 5 to row 11 and horizontally across all 3 columns
      worksheet.mergeCells(`${startCol}5:${endCol}11`);

      colIndex += 3;
    });

    // Merge summary columns - each summary header spans vertically from row 5 to row 11
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

    // Set row heights
    worksheet.getRow(5).height = 25; // Module names row
    worksheet.getRow(6).height = 20;
    worksheet.getRow(7).height = 20;
    worksheet.getRow(8).height = 20;
    worksheet.getRow(9).height = 20;
    worksheet.getRow(10).height = 20;
    worksheet.getRow(11).height = 20;
    worksheet.getRow(12).height = 25; // Header row

    // Apply borders and formatting
    const totalRows = studentStartRow + programReport.students.length - 1;

    // Border the main data area (from headers down)
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
          // Name column - left align
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

    // Style header row
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

    // Style module header rows (5, 10, 11)
    [5, 10, 11].forEach((rowNum) => {
      const row = worksheet.getRow(rowNum);
      for (let c = 5; c <= 4 + moduleColumns.length * 3; c++) {
        const cell = row.getCell(c);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNum === 5) {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F0F0' },
          };
        }
      }
    });

    // Add medium border for module blocks
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

    // Thin borders around summary header merged cells
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

    // Thin surrounding border for left info section (rows 5-10, columns 1-4)
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

    // Thick outer border around whole sheet content starting from row 5 (below header)
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
