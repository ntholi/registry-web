import ExcelJS from 'exceljs';
import { FullRegistrationReport } from './repository';

export function createFullRegistrationExcel(
  report: FullRegistrationReport
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const workbook = new ExcelJS.Workbook();

      // Set workbook properties
      workbook.creator = 'Limkokwing University Registry System';
      workbook.lastModifiedBy = 'Registry System';
      workbook.created = report.generatedAt;
      workbook.modified = report.generatedAt;

      const worksheet = workbook.addWorksheet('Full Registration Report', {
        properties: { tabColor: { argb: 'FF0066CC' } },
      });

      // Add header information
      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').value =
        'LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY';
      worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A2:F2');
      worksheet.getCell('A2').value =
        'REGISTRY DEPARTMENT - FULL REGISTRATION REPORT';
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

      // Add some spacing
      worksheet.addRow([]);

      // Create table headers
      const headerRow = worksheet.addRow([
        'No.',
        'Student Number',
        'Student Name',
        'Program',
        'Semester',
        'School',
      ]);

      // Style the header row
      headerRow.font = { name: 'Arial', size: 12, bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0066CC' },
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Set header text color to white
      headerRow.eachCell((cell) => {
        cell.font = {
          name: 'Arial',
          size: 12,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Add student data
      report.students.forEach((student, index) => {
        const row = worksheet.addRow([
          index + 1,
          student.stdNo,
          student.name,
          student.programName,
          student.semesterNumber,
          student.schoolName,
        ]);

        // Style data rows
        row.font = { name: 'Arial', size: 11 };
        row.alignment = { horizontal: 'left', vertical: 'middle' };

        // Alternate row colors
        if (index % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' },
          };
        }

        // Add borders
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          // Center align student number and semester
          if (colNumber === 2 || colNumber === 5) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      });

      // Auto-fit columns
      worksheet.columns = [
        { header: 'No.', key: 'no', width: 6 },
        { header: 'Student Number', key: 'stdNo', width: 15 },
        { header: 'Student Name', key: 'name', width: 25 },
        { header: 'Program', key: 'program', width: 35 },
        { header: 'Semester', key: 'semester', width: 10 },
        { header: 'School', key: 'school', width: 20 },
      ];

      // Add a summary at the bottom
      const summaryStartRow = worksheet.rowCount + 2;

      worksheet.mergeCells(`A${summaryStartRow}:B${summaryStartRow}`);
      worksheet.getCell(`A${summaryStartRow}`).value = 'SUMMARY STATISTICS';
      worksheet.getCell(`A${summaryStartRow}`).font = {
        name: 'Arial',
        size: 12,
        bold: true,
      };
      worksheet.getCell(`A${summaryStartRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE9ECEF' },
      };

      const summaryData = [
        ['Total Students Registered:', report.totalStudents],
        ['Term:', report.termName],
        ['Report Generated:', report.generatedAt.toLocaleDateString('en-LS')],
        ['Generated By:', 'Registry System'],
      ];

      summaryData.forEach((data, index) => {
        const row = worksheet.addRow(data);
        row.getCell(1).font = { name: 'Arial', size: 10, bold: true };
        row.getCell(2).font = { name: 'Arial', size: 10 };

        if (index === 0) {
          row.getCell(2).font = {
            name: 'Arial',
            size: 12,
            bold: true,
            color: { argb: 'FF0066CC' },
          };
        }
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      resolve(Buffer.from(buffer));
    } catch (error) {
      reject(error);
    }
  });
}
