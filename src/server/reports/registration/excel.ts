import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import { compareSemesters, formatSemester } from '@/shared/lib/utils/utils';
import type {
	FullRegistrationReport,
	SummaryRegistrationReport,
} from './repository';

export async function createFullRegistrationExcel(
	report: FullRegistrationReport,
	summaryReport?: SummaryRegistrationReport
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();

	workbook.creator = 'Limkokwing University Registry System';
	workbook.lastModifiedBy = 'Registry System';
	workbook.created = report.generatedAt;
	workbook.modified = report.generatedAt;

	const worksheet = workbook.addWorksheet('Full Registration Report');

	worksheet.columns = [
		{ header: 'No.', key: 'no', width: 6 },
		{ header: 'Student Number', key: 'stdNo', width: 15 },
		{ header: 'Student Name', key: 'name', width: 30 },
		{ header: 'Program', key: 'program', width: 42 },
		{ header: 'Semester', key: 'semester', width: 15 },
		{ header: 'Sponsor', key: 'sponsor', width: 20 },
		{ header: 'School', key: 'school', width: 46 },
	];

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

	worksheet.mergeCells('A1:G1');
	worksheet.getCell('A1').value = '';

	worksheet.mergeCells('A2:G2');
	worksheet.getCell('A2').value = '';

	worksheet.mergeCells('A3:G3');
	worksheet.getCell('A3').value = '';

	worksheet.mergeCells('A4:G4');
	worksheet.getCell('A4').value = '';

	worksheet.mergeCells('A5:G5');
	worksheet.getCell('A5').value = '';

	worksheet.mergeCells('A6:G6');
	worksheet.getCell('A6').value = 'Registration Report';
	worksheet.getCell('A6').font = { name: 'Arial', size: 16, bold: true };
	worksheet.getCell('A6').alignment = { horizontal: 'center' };

	worksheet.mergeCells('A7:G7');
	worksheet.getCell('A7').value = `Term: ${report.termName}`;
	worksheet.getCell('A7').font = { name: 'Arial', size: 12, bold: true };
	worksheet.getCell('A7').alignment = { horizontal: 'center' };

	worksheet.mergeCells('A8:G8');
	worksheet.getCell('A8').value = `Total Students: ${report.totalStudents}`;
	worksheet.getCell('A8').font = { name: 'Arial', size: 12 };
	worksheet.getCell('A8').alignment = { horizontal: 'center' };

	worksheet.mergeCells('A9:G9');
	worksheet.getCell('A9').value =
		`Generated: ${report.generatedAt.toLocaleDateString('en-LS', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})}`;
	worksheet.getCell('A9').font = { name: 'Arial', size: 10, italic: true };
	worksheet.getCell('A9').alignment = { horizontal: 'center' };

	worksheet.addRow([]);

	const headerRow = worksheet.addRow([
		'No.',
		'Student Number',
		'Student Name',
		'Program',
		'Semester',
		'Sponsor',
		'School',
	]);

	headerRow.font = { name: 'Arial', size: 12, bold: true };
	headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

	headerRow.eachCell((cell, colNumber) => {
		cell.font = {
			name: 'Arial',
			size: 12,
			bold: true,
			color: { argb: 'FF000000' },
		};

		if (colNumber >= 1 && colNumber <= 7) {
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
			student.sponsorName || '-',
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

	if (summaryReport) {
		createSummarySheet(workbook, summaryReport);
	}

	const buffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(buffer);
}

function createSummarySheet(
	workbook: ExcelJS.Workbook,
	summaryReport: SummaryRegistrationReport
) {
	const worksheet = workbook.addWorksheet('Summary');

	const allSemesters = new Set<string>();
	summaryReport.schools.forEach((school) => {
		school.programs.forEach((program) => {
			Object.keys(program.yearBreakdown).forEach((sem) => {
				allSemesters.add(sem);
			});
		});
	});

	const sortedSemesters = Array.from(allSemesters).sort(compareSemesters);

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

	headerRow.eachCell((cell, colNumber) => {
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

		const semStart = 3;
		const semEnd = 2 + sortedSemesters.length;
		const isSemesterCol = colNumber >= semStart && colNumber <= semEnd;

		cell.font = {
			name: 'Arial',
			size: isSemesterCol ? 11 : 12,
			bold: true,
			color: { argb: 'FFFFFFFF' },
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
		const schoolSemesterTotals: { [key: string]: number } = {};

		school.programs.forEach((program) => {
			Object.entries(program.yearBreakdown).forEach(([sem, count]) => {
				schoolSemesterTotals[sem] = (schoolSemesterTotals[sem] || 0) + count;
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
	const grandTotalSemesters: { [key: string]: number } = {};
	let grandTotal = 0;

	summaryReport.schools.forEach((school) => {
		grandTotal += school.totalStudents;
		school.programs.forEach((program) => {
			Object.entries(program.yearBreakdown).forEach(([sem, count]) => {
				grandTotalSemesters[sem] = (grandTotalSemesters[sem] || 0) + count;
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
