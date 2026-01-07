import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import type { GraduatedStudent, GraduationsFilter } from '../_lib/types';

interface DynamicExcelColumn {
	key: string;
	header: string;
	width: number;
	getValue: (student: GraduatedStudent) => string | number;
}

function getActiveFilterColumns(
	filter?: GraduationsFilter
): DynamicExcelColumn[] {
	const columns: DynamicExcelColumn[] = [];

	if (filter?.programLevels && filter.programLevels.length > 0) {
		columns.push({
			key: 'programLevel',
			header: 'Program Level',
			width: 15,
			getValue: (student) => student.programLevel || '-',
		});
	}

	if (filter?.country) {
		columns.push({
			key: 'country',
			header: 'Country',
			width: 15,
			getValue: (student) => student.country || '-',
		});
	}

	if (
		(filter?.ageRangeMin && filter.ageRangeMin !== 12) ||
		(filter?.ageRangeMax && filter.ageRangeMax !== 75)
	) {
		columns.push({
			key: 'age',
			header: 'Age',
			width: 8,
			getValue: (student) => (student.age !== null ? student.age : '-'),
		});
	}

	return columns;
}

export async function createGraduationStudentsExcel(
	report: {
		totalGraduates: number;
		students: GraduatedStudent[];
		generatedAt: Date;
	},
	summaryReport: {
		totalGraduates: number;
		schools: Array<{
			schoolName: string;
			schoolCode: string;
			totalGraduates: number;
			programs: Array<{
				programName: string;
				totalGraduates: number;
			}>;
		}>;
		stats: {
			totalGraduates: number;
			byGender: Array<{ gender: string; count: number }>;
			byLevel: Array<{ level: string; count: number }>;
			averageAge: number | null;
			averageTimeToGraduate: number | null;
		};
	},
	filter?: GraduationsFilter
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();

	workbook.creator = 'Limkokwing University Registry System';
	workbook.lastModifiedBy = 'Registry System';
	workbook.created = report.generatedAt;
	workbook.modified = report.generatedAt;

	const worksheet = workbook.addWorksheet('Graduated Students');

	const dynamicColumns = getActiveFilterColumns(filter);

	const baseColumns = [
		{ header: 'No.', key: 'no', width: 6 },
		{ header: 'Student Number', key: 'stdNo', width: 15 },
		{ header: 'Student Name', key: 'name', width: 30 },
		{ header: 'Gender', key: 'gender', width: 10 },
		{ header: 'Program', key: 'program', width: 42 },
		{ header: 'School', key: 'school', width: 46 },
		{ header: 'Sponsor', key: 'sponsor', width: 20 },
		{ header: 'Graduation Date', key: 'graduationDate', width: 15 },
	];

	const allColumns = [
		...baseColumns,
		...dynamicColumns.map((col) => ({
			header: col.header,
			key: col.key,
			width: col.width,
		})),
	];

	worksheet.columns = allColumns;

	const totalColumnCount = allColumns.length;
	const lastColLetter = String.fromCharCode(64 + totalColumnCount);

	const logoPath = path.join(
		process.cwd(),
		'public',
		'images',
		'logo-lesotho.jpg'
	);

	try {
		const logoData = fs.readFileSync(logoPath);
		const metadata = await sharp(logoData).metadata();
		const naturalWidth = metadata.width ?? 100;
		const naturalHeight = metadata.height ?? 100;

		const maxWidth = 200;
		const maxHeight = 100;

		const ratio = Math.min(
			maxWidth / naturalWidth,
			maxHeight / naturalHeight,
			1
		);
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
	} catch (error) {
		console.error('Error loading logo:', error);
	}

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
	worksheet.getCell('A7').value = `Total Graduates: ${report.totalGraduates}`;
	worksheet.getCell('A7').font = { name: 'Arial', size: 12, bold: true };
	worksheet.getCell('A7').alignment = { horizontal: 'center' };

	worksheet.mergeCells(`A8:${lastColLetter}8`);
	worksheet.getCell('A8').value =
		`Generated: ${report.generatedAt.toLocaleDateString('en-LS', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})}`;
	worksheet.getCell('A8').font = { name: 'Arial', size: 10 };
	worksheet.getCell('A8').alignment = { horizontal: 'center' };

	worksheet.addRow([]);

	const headerRow = worksheet.addRow(allColumns.map((col) => col.header));
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF000000' },
	};
	headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
	headerRow.height = 20;

	report.students.forEach((student, index) => {
		const rowData: Record<string, string | number> = {
			no: index + 1,
			stdNo: student.stdNo,
			name: student.name,
			gender: student.gender || '-',
			program: student.programName,
			school: student.schoolName,
			sponsor: student.sponsorName || '-',
			graduationDate: student.graduationDate,
		};

		dynamicColumns.forEach((col) => {
			rowData[col.key] = col.getValue(student);
		});

		const dataRow = worksheet.addRow(rowData);

		if (index % 2 === 0) {
			dataRow.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF8F8F8' },
			};
		}

		dataRow.alignment = { vertical: 'middle' };
		dataRow.font = { size: 10 };
	});

	worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
		if (rowNumber > 10) {
			row.eachCell((cell: ExcelJS.Cell) => {
				cell.border = {
					top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
					left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
					bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
					right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
				};
			});
		}
	});

	const summaryWorksheet = workbook.addWorksheet('Summary');

	summaryWorksheet.columns = [
		{ header: 'Metric', key: 'metric', width: 30 },
		{ header: 'Value', key: 'value', width: 20 },
	];

	summaryWorksheet.addRow([]);
	summaryWorksheet.addRow([]);

	summaryWorksheet.mergeCells('A3:B3');
	summaryWorksheet.getCell('A3').value = 'Graduation Statistics';
	summaryWorksheet.getCell('A3').font = {
		name: 'Arial',
		size: 14,
		bold: true,
	};
	summaryWorksheet.getCell('A3').alignment = { horizontal: 'center' };

	summaryWorksheet.addRow([]);

	const statsHeaderRow = summaryWorksheet.addRow(['Metric', 'Value']);
	statsHeaderRow.font = {
		bold: true,
		color: { argb: 'FFFFFFFF' },
		size: 11,
	};
	statsHeaderRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF000000' },
	};
	statsHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

	summaryWorksheet.addRow([
		'Total Graduates',
		summaryReport.stats.totalGraduates,
	]);

	if (summaryReport.stats.averageAge !== null) {
		summaryWorksheet.addRow([
			'Average Age',
			`${summaryReport.stats.averageAge} years`,
		]);
	}

	if (summaryReport.stats.averageTimeToGraduate !== null) {
		summaryWorksheet.addRow([
			'Average Time to Graduate',
			`${summaryReport.stats.averageTimeToGraduate} months`,
		]);
	}

	summaryWorksheet.addRow([]);
	summaryWorksheet.addRow(['By Gender', '']);

	summaryReport.stats.byGender.forEach((item) => {
		summaryWorksheet.addRow([item.gender, item.count]);
	});

	summaryWorksheet.addRow([]);
	summaryWorksheet.addRow(['By Program Level', '']);

	summaryReport.stats.byLevel.forEach((item) => {
		summaryWorksheet.addRow([item.level, item.count]);
	});

	summaryWorksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
		if (rowNumber > 5) {
			row.eachCell((cell: ExcelJS.Cell) => {
				cell.border = {
					top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
					left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
					bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
					right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
				};
			});
		}
	});

	const buffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(buffer);
}
