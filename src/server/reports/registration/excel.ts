import ExcelJS from 'exceljs';
import {
  FullRegistrationReport,
  SummaryRegistrationReport,
} from './repository';
import { formatSemester } from '@/lib/utils';

export function createFullRegistrationExcel(
  report: FullRegistrationReport,
  summaryReport?: SummaryRegistrationReport
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Limkokwing University Registry System';
      workbook.lastModifiedBy = 'Registry System';
      workbook.created = report.generatedAt;
      workbook.modified = report.generatedAt;

      const worksheet = workbook.addWorksheet('Full Registration Report');

      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').value =
        'LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY';
      worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A2:F2');
      worksheet.getCell('A2').value = 'Registration Report';
      worksheet.getCell('A2').font = { name: 'Arial', size: 14, bold: true };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A3:F3');
      worksheet.getCell('A3').value = `Term: ${report.termName}`;
      worksheet.getCell('A3').font = { name: 'Arial', size: 12, bold: true };
      worksheet.getCell('A3').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A4:F4');
      worksheet.getCell('A4').value = `Total Students: ${report.totalStudents}`;
      worksheet.getCell('A4').font = { name: 'Arial', size: 12 };
      worksheet.getCell('A4').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A5:F5');
      worksheet.getCell('A5').value =
        `Generated: ${report.generatedAt.toLocaleDateString('en-LS', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`;
      worksheet.getCell('A5').font = { name: 'Arial', size: 10, italic: true };
      worksheet.getCell('A5').alignment = { horizontal: 'center' };

      worksheet.addRow([]);

      const headerRow = worksheet.addRow([
        'No.',
        'Student Number',
        'Student Name',
        'Program',
        'Semester',
        'School',
      ]);

      headerRow.font = { name: 'Arial', size: 12, bold: true };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Apply black background and white font only to the first 6 header cells (A..F)
      headerRow.eachCell((cell, colNumber) => {
        // default font settings for all header cells
        cell.font = {
          name: 'Arial',
          size: 12,
          bold: true,
          color: { argb: 'FF000000' },
        };

        // Apply black fill and white font color only for columns 1..6
        if (colNumber >= 1 && colNumber <= 6) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF000000' },
          };
          cell.font = {
            name: 'Arial',
            size: 12,
            bold: true,
            color: { argb: 'FFFFFFFF' },
          };
        }

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      report.students.forEach((student, index) => {
        const row = worksheet.addRow([
          index + 1,
          student.stdNo,
          student.name,
          student.programName,
          formatSemester(student.semesterNumber, 'short'),
          student.schoolName,
        ]);

        row.font = { name: 'Arial', size: 11 };
        row.alignment = { horizontal: 'left', vertical: 'middle' };

        if (index % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' },
          };
        }

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          if (colNumber === 2 || colNumber === 5) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      });

      worksheet.columns = [
        { header: 'No.', key: 'no', width: 6 },
        { header: 'Student Number', key: 'stdNo', width: 15 },
        { header: 'Student Name', key: 'name', width: 25 },
        { header: 'Program', key: 'program', width: 35 },
        { header: 'Semester', key: 'semester', width: 10 },
        { header: 'School', key: 'school', width: 20 },
      ];

      if (summaryReport) {
        createSummarySheet(workbook, summaryReport);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      resolve(Buffer.from(buffer));
    } catch (error) {
      reject(error);
    }
  });
}

function createSummarySheet(
  workbook: ExcelJS.Workbook,
  summaryReport: SummaryRegistrationReport
) {
  const worksheet = workbook.addWorksheet('Summary');

  const allSemesters = new Set<number>();
  summaryReport.schools.forEach((school) => {
    school.programs.forEach((program) => {
      Object.keys(program.yearBreakdown).forEach((sem) => {
        allSemesters.add(Number(sem));
      });
    });
  });

  const sortedSemesters = Array.from(allSemesters).sort((a, b) => a - b);

  const columns: Partial<ExcelJS.Column>[] = [
    { key: 'schoolFaculty', width: 50 },
    { key: 'program', width: 50 },
  ];

  const headerLabels = ['School/Faculty', 'Program'];

  sortedSemesters.forEach((sem) => {
    columns.push({ key: `sem${sem}`, width: 10 });
    headerLabels.push(formatSemester(sem, 'mini'));
  });

  columns.push({ key: 'total', width: 12 });
  headerLabels.push('Total');

  worksheet.columns = columns;

  const headerRow = worksheet.addRow(headerLabels);

  headerRow.font = {
    name: 'Arial',
    size: 12,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000000' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  summaryReport.schools.forEach((school) => {
    const schoolRowData: (string | number)[] = [school.schoolName];
    for (let i = 1; i < headerLabels.length; i++) {
      schoolRowData.push('');
    }

    const schoolRow = worksheet.addRow(schoolRowData);

    schoolRow.font = {
      name: 'Arial',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    schoolRow.alignment = { horizontal: 'left', vertical: 'middle' };
    schoolRow.height = 22;

    schoolRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4A4A4A' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    school.programs.forEach((program) => {
      const programRowData: (string | number)[] = ['', program.programName];

      sortedSemesters.forEach((sem) => {
        const count = program.yearBreakdown[sem] || 0;
        programRowData.push(count > 0 ? count : '');
      });

      programRowData.push(program.totalStudents);

      const programRow = worksheet.addRow(programRowData);

      programRow.font = { name: 'Arial', size: 11 };
      programRow.alignment = { horizontal: 'left', vertical: 'middle' };

      for (let i = 3; i <= programRowData.length; i++) {
        programRow.getCell(i).alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
      }

      programRow.getCell(programRowData.length).font = {
        name: 'Arial',
        size: 11,
        bold: true,
      };

      programRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    const totalRowData: (string | number)[] = ['', 'Total'];
    const schoolSemesterTotals: { [key: number]: number } = {};

    school.programs.forEach((program) => {
      Object.entries(program.yearBreakdown).forEach(([sem, count]) => {
        const semNum = Number(sem);
        schoolSemesterTotals[semNum] =
          (schoolSemesterTotals[semNum] || 0) + count;
      });
    });

    sortedSemesters.forEach((sem) => {
      totalRowData.push(schoolSemesterTotals[sem] || '');
    });

    totalRowData.push(school.totalStudents);

    const totalRow = worksheet.addRow(totalRowData);

    totalRow.font = { name: 'Arial', size: 11, bold: true };
    totalRow.alignment = { horizontal: 'left', vertical: 'middle' };

    for (let i = 3; i <= totalRowData.length; i++) {
      totalRow.getCell(i).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
    }

    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  const grandTotalRowData: (string | number)[] = ['', 'GRAND TOTAL'];
  const grandTotalSemesters: { [key: number]: number } = {};
  let grandTotal = 0;

  summaryReport.schools.forEach((school) => {
    grandTotal += school.totalStudents;
    school.programs.forEach((program) => {
      Object.entries(program.yearBreakdown).forEach(([sem, count]) => {
        const semNum = Number(sem);
        grandTotalSemesters[semNum] =
          (grandTotalSemesters[semNum] || 0) + count;
      });
    });
  });

  sortedSemesters.forEach((sem) => {
    grandTotalRowData.push(grandTotalSemesters[sem] || '');
  });

  grandTotalRowData.push(grandTotal);

  const grandTotalRow = worksheet.addRow(grandTotalRowData);

  grandTotalRow.font = {
    name: 'Arial',
    size: 12,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  grandTotalRow.alignment = { horizontal: 'left', vertical: 'middle' };
  grandTotalRow.height = 25;

  grandTotalRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000000' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  for (let i = 3; i <= grandTotalRowData.length; i++) {
    grandTotalRow.getCell(i).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
  }
}
