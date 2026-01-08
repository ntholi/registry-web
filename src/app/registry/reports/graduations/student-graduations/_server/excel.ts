import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import { formatDateTime } from '@/shared/lib/utils/dates';
import type {
	GraduationFullReport,
	GraduationReportFilter,
	GraduationSummaryReport,
} from '../_lib/types';

interface DynamicExcelColumn {
	key: string;
	header: string;
	width: number;
	getValue: (student: GraduationFullReport['students'][0]) => string | number;
}

const ALL_EXCEL_COLUMNS: DynamicExcelColumn[] = [
	{
		key: 'stdNo',
		header: 'Student Number',
		width: 15,
		getValue: (s) => s.stdNo,
	},
	{ key: 'name', header: 'Student Name', width: 30, getValue: (s) => s.name },
	{
		key: 'gender',
		header: 'Gender',
		width: 10,
		getValue: (s) =>
			s.gender === 'Male' ? 'M' : s.gender === 'Female' ? 'F' : '-',
	},
	{
		key: 'program',
		header: 'Program',
		width: 42,
		getValue: (s) => s.programName,
	},
	{ key: 'school', header: 'School', width: 46, getValue: (s) => s.schoolName },
	{
		key: 'graduationDate',
		header: 'Graduation Date',
		width: 18,
		getValue: (s) => s.graduationDate,
	},
	{
		key: 'sponsor',
		header: 'Sponsor',
		width: 20,
		getValue: (s) => s.sponsorName || '-',
	},
	{
		key: 'programLevel',
		header: 'Program Level',
		width: 15,
		getValue: (s) => s.programLevel || '-',
	},
	{
		key: 'country',
		header: 'Country',
		width: 15,
		getValue: (s) => s.country || '-',
	},
	{
		key: 'age',
		header: 'Age',
		width: 8,
		getValue: (s) => (s.age !== null ? s.age : '-'),
	},
	{ key: 'email', header: 'Email', width: 25, getValue: (s) => s.email || '-' },
	{ key: 'phone', header: 'Phone', width: 15, getValue: (s) => s.phone || '-' },
	{
		key: 'birthDate',
		header: 'Birth Date',
		width: 12,
		getValue: (s) => s.birthDate || '-',
	},
	{
		key: 'birthPlace',
		header: 'Birth Place',
		width: 15,
		getValue: (s) => s.birthPlace || '-',
	},
	{
		key: 'nationalId',
		header: 'National ID',
		width: 15,
		getValue: (s) => s.nationalId || '-',
	},
	{
		key: 'address',
		header: 'Address',
		width: 30,
		getValue: (s) => s.address || '-',
	},
	{
		key: 'intake',
		header: 'Intake',
		width: 12,
		getValue: (s) => s.intake || '-',
	},
];

const DEFAULT_VISIBLE = [
	'stdNo',
	'name',
	'gender',
	'program',
	'school',
	'graduationDate',
	'sponsor',
];

function getVisibleExcelColumns(
	filter?: GraduationReportFilter
): DynamicExcelColumn[] {
	const visibleKeys = filter?.visibleColumns ?? DEFAULT_VISIBLE;
	return ALL_EXCEL_COLUMNS.filter((col) => visibleKeys.includes(col.key));
}

export async function createGraduationExcel(
	report: GraduationFullReport,
	summaryReport?: GraduationSummaryReport,
	filter?: GraduationReportFilter
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();

	workbook.creator = 'Limkokwing University Registry System';
	workbook.lastModifiedBy = 'Registry System';
	workbook.created = report.generatedAt;
	workbook.modified = report.generatedAt;

	const worksheet = workbook.addWorksheet('Graduates List');

	const visibleColumns = getVisibleExcelColumns(filter);

	const allColumns = [
		{ header: 'No.', key: 'no', width: 6 },
		...visibleColumns.map((col) => ({
			header: col.header,
			key: col.key,
			width: col.width,
		})),
	];

	worksheet.columns = allColumns;

	const totalColumnCount = allColumns.length;
	const getLastColLetter = (count: number) => {
		if (count <= 26) return String.fromCharCode(64 + count);
		const first = Math.floor((count - 1) / 26);
		const second = ((count - 1) % 26) + 1;
		return String.fromCharCode(64 + first) + String.fromCharCode(64 + second);
	};
	const lastColLetter = getLastColLetter(totalColumnCount);

	const logoPath = path.join(
		process.cwd(),
		'public',
		'images',
		'logo-lesotho.jpg'
	);
	const logoData = fs.readFileSync(logoPath);

	const metadata = await sharp(logoData).metadata();
	const naturalWidth = metadata.width ?? 100;
	const naturalHeight = metadata.height ?? 100;

	const maxWidth = 200;
	const maxHeight = 100;

	const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
	const width = Math.round(naturalWidth * ratio);
	const height = Math.round(naturalHeight * ratio);

	const arrayBuffer = logoData.buffer.slice(
		logoData.byteOffset,
		logoData.byteOffset + logoData.byteLength
	);

	const imageId = workbook.addImage({
		buffer: arrayBuffer,
		extension: 'jpeg',
	});

	worksheet.addImage(imageId, {
		tl: { col: 3, row: 0.5 } as ExcelJS.Anchor,
		ext: { width, height },
		editAs: 'oneCell',
	});

	worksheet.mergeCells(`A1:${lastColLetter}1`);
	worksheet.getCell('A1').value = '';

	worksheet.mergeCells(`A2:${lastColLetter}2`);
	worksheet.getCell('A2').value = '';

	worksheet.mergeCells(`A3:${lastColLetter}3`);
	worksheet.getCell('A3').value = '';

	worksheet.mergeCells(`A4:${lastColLetter}4`);
	worksheet.getCell('A4').value = '';

	worksheet.mergeCells(`A5:${lastColLetter}5`);
	worksheet.getCell('A5').value = '';

	worksheet.mergeCells(`A6:${lastColLetter}6`);
	worksheet.getCell('A6').value = 'Graduation Report';
	worksheet.getCell('A6').font = { name: 'Arial', size: 16, bold: true };
	worksheet.getCell('A6').alignment = { horizontal: 'center' };

	worksheet.mergeCells(`A7:${lastColLetter}7`);
	worksheet.getCell('A7').value = `Graduation Date: ${report.graduationDate}`;
	worksheet.getCell('A7').font = { name: 'Arial', size: 12, bold: true };
	worksheet.getCell('A7').alignment = { horizontal: 'center' };

	worksheet.mergeCells(`A8:${lastColLetter}8`);
	worksheet.getCell('A8').value = `Total Graduates: ${report.totalGraduates}`;
	worksheet.getCell('A8').font = { name: 'Arial', size: 12 };
	worksheet.getCell('A8').alignment = { horizontal: 'center' };

	worksheet.mergeCells(`A9:${lastColLetter}9`);
	worksheet.getCell('A9').value =
		`Generated: ${formatDateTime(report.generatedAt)}`;
	worksheet.getCell('A9').font = { name: 'Arial', size: 10, italic: true };
	worksheet.getCell('A9').alignment = { horizontal: 'center' };

	worksheet.addRow([]);

	const headerLabels = ['No.', ...visibleColumns.map((col) => col.header)];

	const headerRow = worksheet.addRow(headerLabels);

	headerRow.font = { name: 'Arial', size: 12, bold: true };
	headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

	headerRow.eachCell((cell, colNumber) => {
		cell.font = {
			name: 'Arial',
			size: 12,
			bold: true,
			color: { argb: 'FF000000' },
		};

		if (colNumber >= 1 && colNumber <= totalColumnCount) {
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
		const rowData = [
			index + 1,
			...visibleColumns.map((col) => col.getValue(student)),
		];

		const row = worksheet.addRow(rowData);

		row.font = { name: 'Arial', size: 11 };
		row.alignment = { horizontal: 'left', vertical: 'middle' };

		if (index % 2 === 1) {
			row.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF8F9FA' },
			};
		}

		row.eachCell((cell) => {
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' },
			};
		});
	});

	if (summaryReport) {
		createSummarySheet(workbook, summaryReport);
	}

	const buffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(buffer);
}

function createSummarySheet(
	workbook: ExcelJS.Workbook,
	summaryReport: GraduationSummaryReport
) {
	const worksheet = workbook.addWorksheet('Summary');

	const columns: Partial<ExcelJS.Column>[] = [
		{ key: 'schoolFaculty', width: 50 },
		{ key: 'program', width: 50 },
		{ key: 'male', width: 10 },
		{ key: 'female', width: 10 },
		{ key: 'total', width: 12 },
	];

	const headerLabels = ['School/Faculty', 'Program', 'Male', 'Female', 'Total'];

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

	for (const school of summaryReport.schools) {
		const schoolRowData: (string | number)[] = [
			school.schoolName,
			'',
			'',
			'',
			'',
		];

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

		for (const [index, program] of school.programs.entries()) {
			const programRowData = [
				'',
				program.programName,
				program.maleCount,
				program.femaleCount,
				program.totalGraduates,
			];

			const programRow = worksheet.addRow(programRowData);

			programRow.font = { name: 'Arial', size: 11 };
			programRow.alignment = { horizontal: 'left', vertical: 'middle' };

			if (index % 2 === 1) {
				programRow.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFF8F9FA' },
				};
			}

			programRow.eachCell((cell, colNumber) => {
				cell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' },
				};

				if (colNumber >= 3 && colNumber <= 5) {
					cell.alignment = { horizontal: 'center', vertical: 'middle' };
				}
			});
		}

		const schoolTotalRow = worksheet.addRow([
			'',
			'School Total',
			school.maleCount,
			school.femaleCount,
			school.totalGraduates,
		]);

		schoolTotalRow.font = { name: 'Arial', size: 11, bold: true };
		schoolTotalRow.alignment = { horizontal: 'left', vertical: 'middle' };

		schoolTotalRow.eachCell((cell, colNumber) => {
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFE8E8E8' },
			};
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' },
			};

			if (colNumber >= 3 && colNumber <= 5) {
				cell.alignment = { horizontal: 'center', vertical: 'middle' };
			}
		});
	}

	const grandTotalRow = worksheet.addRow([
		'Grand Total',
		'',
		summaryReport.maleCount,
		summaryReport.femaleCount,
		summaryReport.totalGraduates,
	]);

	grandTotalRow.font = {
		name: 'Arial',
		size: 12,
		bold: true,
		color: { argb: 'FFFFFFFF' },
	};
	grandTotalRow.alignment = { horizontal: 'left', vertical: 'middle' };
	grandTotalRow.height = 25;

	grandTotalRow.eachCell((cell, colNumber) => {
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

		if (colNumber >= 3 && colNumber <= 5) {
			cell.alignment = { horizontal: 'center', vertical: 'middle' };
		}
	});
}
