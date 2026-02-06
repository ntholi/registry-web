import ExcelJS from 'exceljs';
import type { AttendanceStatus } from '@/core/database';
import type { WeekInfo } from './repository';

interface AttendanceExportStudent {
	stdNo: number;
	name: string;
	weeklyAttendance: { weekNumber: number; status: AttendanceStatus }[];
}

interface AttendanceExportData {
	moduleCode: string;
	moduleName: string;
	className: string;
	lecturerName: string;
	termName: string;
	termCode: string;
	weeks: WeekInfo[];
	students: AttendanceExportStudent[];
}

function mapAttendanceStatus(status: AttendanceStatus): string {
	if (status === 'present') return 'P';
	if (status === 'absent') return 'A';
	if (status === 'late') return 'L';
	if (status === 'excused') return 'E';
	if (status === 'no_class') return 'NC';
	return '';
}

function applyCellBorder(cell: ExcelJS.Cell) {
	cell.border = {
		top: { style: 'thin' },
		left: { style: 'thin' },
		bottom: { style: 'thin' },
		right: { style: 'thin' },
	};
}

function applyRowBorders(row: ExcelJS.Row, maxCol: number) {
	for (let i = 1; i <= maxCol; i += 1) {
		applyCellBorder(row.getCell(i));
	}
}

function setInfoRow(
	worksheet: ExcelJS.Worksheet,
	rowNumber: number,
	label: string,
	value: string,
	lastColumn: number
) {
	const labelStartColumn = 3;
	const labelEndColumn = Math.min(labelStartColumn + 1, lastColumn);
	const valueStartColumn = Math.min(labelEndColumn + 1, lastColumn);
	const valueEndColumn = Math.min(valueStartColumn + 2, lastColumn);

	const labelCell = worksheet.getCell(rowNumber, labelStartColumn);
	labelCell.value = label;
	labelCell.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
	labelCell.alignment = { vertical: 'middle', horizontal: 'left' };
	labelCell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF000000' },
	};
	worksheet.mergeCells(rowNumber, labelStartColumn, rowNumber, labelEndColumn);
	applyCellBorder(labelCell);

	const valueCell = worksheet.getCell(rowNumber, valueStartColumn);
	valueCell.value = value;
	valueCell.font = { size: 11 };
	valueCell.alignment = { vertical: 'middle', horizontal: 'left' };
	worksheet.mergeCells(rowNumber, valueStartColumn, rowNumber, valueEndColumn);
	applyCellBorder(valueCell);
}

export async function createAttendanceExcel(
	data: AttendanceExportData
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Attendance');

	const totalColumns = 2 + data.weeks.length;
	const titleRow = 1;
	const termRow = 2;
	const lecturerRow = 3;
	const moduleRow = 4;
	const classRow = 5;
	const headerRow = 7;

	worksheet.mergeCells(titleRow, 1, titleRow, totalColumns);
	const titleCell = worksheet.getCell(titleRow, 1);
	titleCell.value = 'Class Attendance';
	titleCell.font = { size: 14, bold: true };
	titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

	worksheet.mergeCells(termRow, 1, termRow, totalColumns);
	const termCell = worksheet.getCell(termRow, 1);
	termCell.value = data.termName || data.termCode;
	termCell.font = { size: 12, bold: true };
	termCell.alignment = { vertical: 'middle', horizontal: 'center' };

	setInfoRow(
		worksheet,
		lecturerRow,
		'Lecturer',
		data.lecturerName,
		totalColumns
	);
	setInfoRow(
		worksheet,
		moduleRow,
		'Module',
		`${data.moduleCode} - ${data.moduleName}`,
		totalColumns
	);
	setInfoRow(worksheet, classRow, 'Class', data.className, totalColumns);

	const headerLabels = [
		'Student No',
		'Student Name',
		...data.weeks.map((week) => `Week ${week.weekNumber}`),
	];

	const header = worksheet.getRow(headerRow);
	header.height = 22;
	headerLabels.forEach((label, index) => {
		const cell = header.getCell(index + 1);
		cell.value = label;
		cell.font = { bold: true, size: 10 };
		cell.alignment = { vertical: 'middle', horizontal: 'center' };
		applyCellBorder(cell);
	});

	const dataStartRow = headerRow + 1;
	data.students.forEach((student, index) => {
		const row = worksheet.getRow(dataStartRow + index);
		row.height = 20;
		row.getCell(1).value = student.stdNo;
		row.getCell(2).value = student.name;
		row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
		row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

		const statusMap = new Map(
			student.weeklyAttendance.map((item) => [item.weekNumber, item.status])
		);

		data.weeks.forEach((week, weekIndex) => {
			const status = statusMap.get(week.weekNumber);
			const cell = row.getCell(3 + weekIndex);
			cell.value = status ? mapAttendanceStatus(status) : '';
			cell.alignment = { vertical: 'middle', horizontal: 'center' };
		});

		applyRowBorders(row, totalColumns);
	});

	worksheet.getColumn(1).width = 14;
	worksheet.getColumn(2).width = 32;
	for (let i = 3; i <= totalColumns; i += 1) {
		worksheet.getColumn(i).width = 14;
	}

	const buffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(buffer);
}

export type { AttendanceExportData };
