'use server';

import { db } from '@/db';
import {
  programs,
  students,
  structures,
  studentPrograms,
  studentSemesters,
  studentModules,
} from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import ExcelJS from 'exceljs';

// Helper function to get grade color
function getGradeColor(grade: string): string {
  // Pass grades (green colors)
  if (
    [
      'A+',
      'A',
      'A-',
      'B+',
      'B',
      'B-',
      'C+',
      'C',
      'C-',
      'PC',
      'PX',
      'AP',
      'PP',
    ].includes(grade)
  ) {
    return 'FF92D050'; // Green
  }
  // Fail grades (red colors)
  else if (
    ['F', 'X', 'DNC', 'DNA', 'FX', 'FIN', 'GNS', 'ANN', 'DNS'].includes(grade)
  ) {
    return 'FFFF0000'; // Red
  }
  // Default or other grades (yellow)
  else {
    return 'FFFFFF00'; // Yellow
  }
}

// Function to format the worksheet
function formatWorksheet(worksheet: ExcelJS.Worksheet) {
  // Format header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '000000FF' }, // Dark blue
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add borders to all cells
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.alignment = { vertical: 'middle' };

      // Center-align grade cells (from the 5th column onwards)
      if (rowNumber > 1 && cell.col > 4) {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };

        // Color-code grades
        const grade = cell.value as string;
        if (grade) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: getGradeColor(grade) },
          };

          // Make failing grades bold
          if (
            ['F', 'X', 'DNC', 'DNA', 'FX', 'FIN', 'GNS', 'ANN', 'DNS'].includes(
              grade,
            )
          ) {
            cell.font = { bold: true };
          }
        }
      }
    });
  });

  // Freeze the top row
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: 1,
      topLeftCell: 'A2',
      activeCell: 'A2',
    },
  ];
}

// Function to generate BOE report for a specific program (FICT program ID 151)
export async function generateBoeReport() {
  // Create a new Excel workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Limkokwing Registry';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Add properties
  workbook.properties.title = 'FICT Program BOE Report';
  workbook.properties.subject = 'Student Academic Performance';
  workbook.properties.keywords = 'BOE, Grades, Academic';

  // Track statistics for summary sheet
  const statistics = {
    totalStudents: 0,
    totalModules: new Set(),
    structureData: [],
    semesterCounts: new Map(),
  };

  try {
    // First, fetch the FICT program information
    const program = await db.query.programs.findFirst({
      where: eq(programs.id, 151), // FICT program ID is 151
    });

    if (!program) {
      throw new Error('FICT Program not found');
    }

    // Create summary sheet first (will be populated at the end)
    const summarySheet = workbook.addWorksheet('Summary');

    // Get all structures (program versions) for the FICT program
    const programStructures = await db.query.structures.findMany({
      where: eq(structures.programId, program.id),
      with: {
        program: true,
      },
    });

    // For each structure, get the students enrolled in it
    for (const structure of programStructures) {
      // Track structure statistics
      const structureStat = {
        code: structure.code,
        studentCount: 0,
        semesters: new Map(),
      };

      // Get all active students for this structure
      const studentsInStructure = await db.query.studentPrograms.findMany({
        where: and(
          eq(studentPrograms.structureId, structure.id),
          eq(studentPrograms.status, 'Active'),
        ),
        with: {
          student: true,
          semesters: {
            with: {
              studentModules: {
                with: {
                  semesterModule: {
                    with: {
                      module: true,
                      semester: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Update total students count
      statistics.totalStudents += studentsInStructure.length;
      structureStat.studentCount = studentsInStructure.length;

      // Skip if no students
      if (studentsInStructure.length === 0) continue;

      // Group students by semester
      const studentsBySemester = new Map();

      for (const studentProgram of studentsInStructure) {
        for (const semester of studentProgram.semesters) {
          const semesterKey = semester.semesterNumber || 0;

          if (!studentsBySemester.has(semesterKey)) {
            studentsBySemester.set(semesterKey, []);
          }

          studentsBySemester.get(semesterKey).push({
            student: studentProgram.student,
            modules: semester.studentModules,
            semesterStatus: semester.status,
            term: semester.term,
          });
        }
      }

      // Create a worksheet for each semester
      for (const [semesterNumber, students] of studentsBySemester.entries()) {
        if (students.length === 0) continue;

        // Update semester statistics
        if (!statistics.semesterCounts.has(semesterNumber)) {
          statistics.semesterCounts.set(semesterNumber, 0);
        }
        statistics.semesterCounts.set(
          semesterNumber,
          statistics.semesterCounts.get(semesterNumber) + students.length,
        );

        // Track structure-semester statistics
        if (!structureStat.semesters.has(semesterNumber)) {
          structureStat.semesters.set(semesterNumber, 0);
        }
        structureStat.semesters.set(
          semesterNumber,
          structureStat.semesters.get(semesterNumber) + students.length,
        );

        // Create a worksheet for this semester
        const worksheetName = `${structure.code} - Sem ${semesterNumber}`;
        const worksheet = workbook.addWorksheet(worksheetName, {
          properties: { tabColor: { argb: 'FF0070C0' } }, // Blue tab color
        });

        // Add title row with program and semester info
        worksheet.addRow([
          `${program.name} (${program.code}) - Structure: ${structure.code} - Semester: ${semesterNumber}`,
        ]);
        const titleRow = worksheet.getRow(1);
        titleRow.font = { bold: true, size: 14 };
        titleRow.alignment = { horizontal: 'center' };
        worksheet.mergeCells('A1:G1');

        // Add date row
        worksheet.addRow([`Generated on: ${new Date().toLocaleDateString()}`]);
        const dateRow = worksheet.getRow(2);
        dateRow.font = { italic: true };
        worksheet.mergeCells('A2:G2');

        // Blank row for spacing
        worksheet.addRow([]);

        // Set up headers (starting at row 4)
        worksheet.addRow(['Student No', 'Student Name', 'Term', 'Status']);

        // Collect all modules for this semester to dynamically add columns
        const allModuleKeys = new Map(); // Map of code -> name for header tooltip
        students.forEach((studentData) => {
          studentData.modules.forEach((module) => {
            const moduleCode = module.semesterModule.module?.code;
            const moduleName = module.semesterModule.module?.name;
            if (moduleCode) {
              allModuleKeys.set(moduleCode, moduleName);
              statistics.totalModules.add(moduleCode);
            }
          });
        });

        // Sort modules by code and add them to the header
        const headerRow = worksheet.getRow(4);
        let colIndex = 5; // Start after the first 4 columns

        Array.from(allModuleKeys.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .forEach(([moduleCode, moduleName]) => {
            // Add module to header
            headerRow.getCell(colIndex).value = moduleCode;

            // Add comment with full module name
            headerRow.getCell(colIndex).note = moduleName;

            // Set column width
            worksheet.getColumn(colIndex).width = 12;

            colIndex++;
          });

        // Style the header row
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '000000FF' }, // Dark blue
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Set widths for the first 4 columns
        worksheet.getColumn(1).width = 15; // Student No
        worksheet.getColumn(2).width = 35; // Student Name
        worksheet.getColumn(3).width = 15; // Term
        worksheet.getColumn(4).width = 15; // Status

        // Add data rows
        let dataRowIndex = 5; // Start after header

        students.forEach((studentData) => {
          const row = worksheet.getRow(dataRowIndex);

          // Add student information
          row.getCell(1).value = studentData.student.stdNo;
          row.getCell(2).value = studentData.student.name;
          row.getCell(3).value = studentData.term;
          row.getCell(4).value = studentData.semesterStatus;

          // Add module grades
          colIndex = 5;
          Array.from(allModuleKeys.keys())
            .sort()
            .forEach((moduleCode) => {
              const module = studentData.modules.find(
                (m) => m.semesterModule.module?.code === moduleCode,
              );

              if (module) {
                row.getCell(colIndex).value = module.grade;

                // Apply conditional formatting based on grade
                if (module.grade) {
                  row.getCell(colIndex).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: getGradeColor(module.grade) },
                  };

                  // Make failing grades bold
                  if (
                    [
                      'F',
                      'X',
                      'DNC',
                      'DNA',
                      'FX',
                      'FIN',
                      'GNS',
                      'ANN',
                      'DNS',
                    ].includes(module.grade)
                  ) {
                    row.getCell(colIndex).font = { bold: true };
                  }
                }
              }

              colIndex++;
            });

          dataRowIndex++;
        });

        // Format the worksheet
        formatWorksheet(worksheet);
      }

      statistics.structureData.push(structureStat);
    }

    // Populate summary sheet
    populateSummarySheet(summarySheet, program, statistics);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    console.error('Error generating BOE report:', error);
    throw new Error(`Failed to generate BOE report: ${error.message}`);
  }
}

// Function to populate summary sheet
function populateSummarySheet(
  worksheet: ExcelJS.Worksheet,
  program: any,
  statistics: any,
) {
  // Add title row
  worksheet.addRow([
    `${program.name} (${program.code}) - Board of Examination Report Summary`,
  ]);
  const titleRow = worksheet.getRow(1);
  titleRow.font = { bold: true, size: 16 };
  titleRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A1:F1');

  // Add date row
  worksheet.addRow([`Generated on: ${new Date().toLocaleDateString()}`]);
  const dateRow = worksheet.getRow(2);
  dateRow.font = { italic: true };
  worksheet.mergeCells('A2:F2');

  // Empty row
  worksheet.addRow([]);

  // Program Summary Section
  worksheet.addRow(['Program Summary']);
  const summaryTitleRow = worksheet.getRow(4);
  summaryTitleRow.font = { bold: true, size: 14 };
  worksheet.mergeCells('A4:B4');

  // Summary data
  worksheet.addRow(['Total Students', statistics.totalStudents]);
  worksheet.addRow(['Total Modules', statistics.totalModules.size]);
  worksheet.addRow(['Total Structures', statistics.structureData.length]);

  // Empty row
  worksheet.addRow([]);

  // Structure data section
  worksheet.addRow(['Structure Details']);
  const structureTitleRow = worksheet.getRow(8);
  structureTitleRow.font = { bold: true, size: 14 };
  worksheet.mergeCells('A8:D8');

  // Header for structure table
  worksheet.addRow(['Structure Code', 'Student Count', 'Semesters', '']);
  const structureHeaderRow = worksheet.getRow(9);
  structureHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  structureHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '000000FF' }, // Dark blue
  };

  // Add structure data
  let rowIndex = 10;
  statistics.structureData.forEach((structureStat) => {
    const row = worksheet.getRow(rowIndex);
    row.getCell(1).value = structureStat.code;
    row.getCell(2).value = structureStat.studentCount;

    // Create semester distribution string
    const semesterDistribution = Array.from(structureStat.semesters.entries())
      .map(([sem, count]) => `Semester ${sem}: ${count} students`)
      .join(', ');

    row.getCell(3).value = semesterDistribution;
    worksheet.mergeCells(`C${rowIndex}:D${rowIndex}`);

    rowIndex++;
  });

  // Empty row
  worksheet.addRow([]);
  rowIndex++;

  // Semester Distribution Section
  worksheet.addRow(['Semester Distribution']);
  const semesterTitleRow = worksheet.getRow(rowIndex);
  semesterTitleRow.font = { bold: true, size: 14 };
  worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
  rowIndex++;

  // Header for semester table
  worksheet.addRow(['Semester', 'Student Count', '% of Total']);
  const semHeaderRow = worksheet.getRow(rowIndex);
  semHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  semHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '000000FF' }, // Dark blue
  };
  rowIndex++;

  // Add semester data
  Array.from(statistics.semesterCounts.entries())
    .sort((a, b) => a[0] - b[0]) // Sort by semester number
    .forEach(([semesterNumber, count]) => {
      const row = worksheet.getRow(rowIndex);
      row.getCell(1).value = `Semester ${semesterNumber}`;
      row.getCell(2).value = count;
      row.getCell(3).value =
        statistics.totalStudents > 0
          ? `${Math.round((count / statistics.totalStudents) * 100)}%`
          : '0%';
      rowIndex++;
    });

  // Format the workbook
  worksheet.getColumn(1).width = 20;
  worksheet.getColumn(2).width = 15;
  worksheet.getColumn(3).width = 40;
  worksheet.getColumn(4).width = 15;

  // Add borders to all cells
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Set tab color
  worksheet.properties.tabColor = { argb: 'FFFF9900' }; // Orange
}
