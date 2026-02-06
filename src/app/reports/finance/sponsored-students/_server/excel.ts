import ExcelJS from 'exceljs';
import { formatSemester } from '@/shared/lib/utils/utils';
import type { SponsoredStudentRow } from './repository';

export async function createSponsoredStudentsExcel(
	students: SponsoredStudentRow[],
	termCode: string
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();

	workbook.creator = 'Limkokwing University Registry System';
	workbook.lastModifiedBy = 'Registry System';
	workbook.created = new Date();
	workbook.modified = new Date();

	const worksheet = workbook.addWorksheet('Sponsored Students');

	worksheet.columns = [
		{ header: 'No.', key: 'no', width: 6 },
		{ header: 'Student No.', key: 'stdNo', width: 15 },
		{ header: 'Name', key: 'name', width: 30 },
		{ header: 'School', key: 'school', width: 10 },
		{ header: 'Program', key: 'program', width: 40 },
		{ header: 'Semester', key: 'semester', width: 12 },
		{ header: 'Sponsor', key: 'sponsor', width: 20 },
		{ header: 'Borrower No.', key: 'borrowerNo', width: 15 },
		{ header: 'Bank Name', key: 'bankName', width: 20 },
		{ header: 'Account No.', key: 'accountNumber', width: 18 },
	];

	worksheet.mergeCells('A1:J1');
	worksheet.getCell('A1').value = 'Sponsored Students Report';
	worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true };
	worksheet.getCell('A1').alignment = { horizontal: 'center' };

	worksheet.mergeCells('A2:J2');
	worksheet.getCell('A2').value = `Term: ${termCode}`;
	worksheet.getCell('A2').font = { name: 'Arial', size: 12, bold: true };
	worksheet.getCell('A2').alignment = { horizontal: 'center' };

	worksheet.mergeCells('A3:J3');
	worksheet.getCell('A3').value = `Total Students: ${students.length}`;
	worksheet.getCell('A3').font = { name: 'Arial', size: 12 };
	worksheet.getCell('A3').alignment = { horizontal: 'center' };

	worksheet.mergeCells('A4:J4');
	worksheet.getCell('A4').value = '';

	const headerRow = worksheet.getRow(5);
	headerRow.values = [
		'No.',
		'Student No.',
		'Name',
		'School',
		'Program',
		'Semester',
		'Sponsor',
		'Borrower No.',
		'Bank Name',
		'Account No.',
	];

	headerRow.eachCell((cell) => {
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF000000' },
		};
		cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
		cell.alignment = { horizontal: 'center', vertical: 'middle' };
		cell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' },
		};
	});

	students.forEach((student, index) => {
		const row = worksheet.addRow({
			no: index + 1,
			stdNo: student.stdNo,
			name: student.name,
			school: student.schoolCode,
			program: student.programName,
			semester: formatSemester(student.semesterNumber, 'mini'),
			sponsor: student.sponsorName,
			borrowerNo: student.borrowerNo || '-',
			bankName: student.bankName || '-',
			accountNumber: student.accountNumber || '-',
		});

		row.eachCell((cell) => {
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' },
			};
		});

		if (index % 2 === 1) {
			row.eachCell((cell) => {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFF2F2F2' },
				};
			});
		}
	});

	const buffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(buffer);
}
