import ExcelJS from 'exceljs';
import { ProgramSemesterReport, StudentSemesterReport } from './repository';
import { getGradePoints, isFailingGrade } from '@/utils/grades';

function getColumnLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

function getUniqueModules(students: StudentSemesterReport[]) {
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

export function createWorksheet(
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

  const moduleColumns = getUniqueModules(programReport.students);
  const totalCols = 4 + moduleColumns.length * 3 + 7; // Base cols + modules (3 cols each) + summary cols
  const endColLetter = getColumnLetter(totalCols);

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

    studentRow.getCell(colIndex++).value = student.modulesCount;
    studentRow.getCell(colIndex++).value = student.creditsAttempted;
    studentRow.getCell(colIndex++).value = student.creditsEarned;
    studentRow.getCell(colIndex++).value = student.totalPoints;

    const gpaVal = parseFloat(student.gpa);
    const cgpaVal = parseFloat(student.cgpa);

    studentRow.getCell(colIndex++).value = isNaN(gpaVal) ? student.gpa : gpaVal;
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
  const nameColumnWidth = Math.max(longestName.length * 1.1, 25);

  worksheet.getColumn(1).width = 4;
  worksheet.getColumn(2).width = nameColumnWidth;
  worksheet.getColumn(3).width = 12;
  worksheet.getColumn(4).width = 8;

  colIndex = 5;
  moduleColumns.forEach(() => {
    worksheet.getColumn(colIndex).width = 6;
    worksheet.getColumn(colIndex + 1).width = 4;
    worksheet.getColumn(colIndex + 2).width = 6;
    colIndex += 3;
  });

  worksheet.getColumn(colIndex++).width = 8;
  worksheet.getColumn(colIndex++).width = 8;
  worksheet.getColumn(colIndex++).width = 8;
  worksheet.getColumn(colIndex++).width = 10;
  worksheet.getColumn(colIndex++).width = 6;
  worksheet.getColumn(colIndex++).width = 6;
  worksheet.getColumn(colIndex++).width = 12;

  worksheet.mergeCells('A5:D5');
  worksheet.mergeCells('A6:D6');
  worksheet.mergeCells('A7:D7');
  worksheet.mergeCells('A8:D8');
  worksheet.mergeCells('A9:D9');
  worksheet.mergeCells('A10:D10');
  worksheet.mergeCells('A11:D11');

  colIndex = 5;
  moduleColumns.forEach(() => {
    const startColLetter = getColumnLetter(colIndex);
    const endColLetter = getColumnLetter(colIndex + 2);

    worksheet.mergeCells(`${startColLetter}5:${endColLetter}9`);
    worksheet.mergeCells(`${startColLetter}10:${endColLetter}10`);
    worksheet.mergeCells(`${startColLetter}11:${endColLetter}11`);

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
    const col = getColumnLetter(colIndex);
    worksheet.mergeCells(`${col}5:${col}11`);
    colIndex++;
  });

  worksheet.getRow(5).height = 25;
  worksheet.getRow(6).height = 20;
  worksheet.getRow(7).height = 20;
  worksheet.getRow(8).height = 20;
  worksheet.getRow(9).height = 20;
  worksheet.getRow(10).height = 20;
  worksheet.getRow(11).height = 20;
  worksheet.getRow(12).height = 25;

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

      const bottomCell = worksheet.getRow(11).getCell(c);
      bottomCell.border = { ...bottomCell.border, bottom: { style: 'medium' } };
    }

    for (let r = 5; r <= 11; r++) {
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
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      if (r === 5) cell.border.top = { style: 'medium' };
      if (r === 11) cell.border.bottom = { style: 'medium' };
      if (c === summaryStartCol) cell.border.left = { style: 'medium' };
      if (c === summaryEndCol) cell.border.right = { style: 'medium' };
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
