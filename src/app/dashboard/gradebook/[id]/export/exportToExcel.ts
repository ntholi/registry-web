import ExcelJS from 'exceljs';
import { getAssessmentTypeLabel } from '../../../assessments/[id]/assessments';

type Student = {
	stdNo: number;
	name: string;
	programId?: number | null;
};

type Assessment = {
	id: number;
	assessmentType: string;
	assessmentNumber: string;
	totalMarks: number;
	weight: number;
};

type AssessmentMark = {
	id: number;
	assessmentId: number;
	stdNo: number;
	marks: number;
};

type ModuleGrade = {
	id: number;
	moduleId: number;
	stdNo: number;
	grade: string;
	weightedTotal: number;
};

type ExportData = {
	students: Student[];
	assessments: Assessment[];
	assessmentMarks: AssessmentMark[];
	moduleGrades: ModuleGrade[];
	moduleName: string;
	moduleCode: string;
	lecturerName: string;
	termName: string;
	className: string;
};

export async function exportToExcel(data: ExportData) {
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Student Mark-Sheet');

	worksheet.pageSetup.orientation = 'landscape';
	worksheet.pageSetup.fitToPage = true;
	worksheet.pageSetup.fitToWidth = 1;
	worksheet.pageSetup.fitToHeight = 0;

	try {
		const logoResponse = await fetch('/images/logo-lesotho.jpg');
		const logoBlob = await logoResponse.blob();
		const logoArrayBuffer = await logoBlob.arrayBuffer();

		const imageId = workbook.addImage({
			buffer: logoArrayBuffer,
			extension: 'jpeg',
		});

		worksheet.addImage(imageId, {
			tl: { col: 0, row: 0 } as unknown as ExcelJS.Anchor,
			br: { col: 2, row: 6 } as unknown as ExcelJS.Anchor,
			editAs: 'oneCell',
		});
	} catch (error) {
		console.error('Failed to load logo:', error);
	}

	worksheet.mergeCells('A1:B6');
	const logoCell = worksheet.getCell('A1');
	logoCell.value = '';
	logoCell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFFFFFFF' },
	};

	worksheet.mergeCells('A7:B7');
	const locationCell = worksheet.getCell('A7');
	locationCell.value = 'LESOTHO';
	locationCell.font = {
		name: 'Arial',
		size: 11,
		bold: true,
	};
	locationCell.alignment = {
		vertical: 'middle',
		horizontal: 'center',
	};

	worksheet.mergeCells('D1:H1');
	const titleCell = worksheet.getCell('D1');
	titleCell.value = 'STUDENT MARK-SHEET';
	titleCell.font = {
		name: 'Arial',
		size: 16,
		bold: true,
	};
	titleCell.alignment = {
		vertical: 'middle',
		horizontal: 'center',
	};

	const infoStartRow = 3;
	const infoCells = [
		{ label: 'MODULE', value: data.moduleName, row: infoStartRow },
		{ label: 'CODE', value: data.moduleCode, row: infoStartRow + 1 },
		{ label: 'Semester Date', value: data.termName, row: infoStartRow + 2 },
		{ label: 'CLASS', value: data.className, row: infoStartRow + 3 },
	];

	infoCells.forEach(({ label, value, row }) => {
		worksheet.mergeCells(`D${row}:E${row}`);
		const labelCell = worksheet.getCell(`D${row}`);
		labelCell.value = label;
		labelCell.font = {
			bold: true,
			size: 10,
			color: { argb: 'FFFFFFFF' },
		};
		labelCell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF000000' },
		};
		labelCell.alignment = { vertical: 'middle', horizontal: 'left' };
		labelCell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' },
		};

		worksheet.mergeCells(`F${row}:J${row}`);
		const valueCell = worksheet.getCell(`F${row}`);
		valueCell.value = value;
		valueCell.font = { size: 10 };
		valueCell.alignment = { vertical: 'middle', horizontal: 'left' };
		valueCell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' },
		};
	});

	const lecturerRow = 8;
	worksheet.mergeCells(`A${lecturerRow}:C${lecturerRow}`);
	const lecturerLabelCell = worksheet.getCell(`A${lecturerRow}`);
	lecturerLabelCell.value = "Lecturer's Name";
	lecturerLabelCell.font = { bold: true, size: 10 };
	lecturerLabelCell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF808080' },
	};
	lecturerLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };
	lecturerLabelCell.border = {
		top: { style: 'thin' },
		left: { style: 'thin' },
		bottom: { style: 'thin' },
		right: { style: 'thin' },
	};

	const lecturerNameRow = 9;
	worksheet.mergeCells(`A${lecturerNameRow}:C${lecturerNameRow}`);
	const lecturerNameCell = worksheet.getCell(`A${lecturerNameRow}`);
	lecturerNameCell.value = data.lecturerName;
	lecturerNameCell.font = { size: 10, color: { argb: 'FFFF0000' } };
	lecturerNameCell.alignment = { vertical: 'middle', horizontal: 'center' };
	lecturerNameCell.border = {
		top: { style: 'thin' },
		left: { style: 'thin' },
		bottom: { style: 'thin' },
		right: { style: 'thin' },
	};

	const headerRow = 11;
	const assessmentHeaders: string[] = [];
	const assessmentWeights: string[] = [];

	data.assessments.forEach((assessment) => {
		const label = `${getAssessmentTypeLabel(assessment.assessmentType)}`;
		assessmentHeaders.push(label, '');
		assessmentWeights.push(
			`Score (${assessment.totalMarks})`,
			`${assessment.weight}%`
		);
	});

	const baseHeaders = ['No', 'Names', 'Student No.'];
	const fullHeaders = [...baseHeaders, ...assessmentHeaders, 'TOTAL', ''];

	const headerRowCells = worksheet.getRow(headerRow);
	fullHeaders.forEach((header, index) => {
		const cell = headerRowCells.getCell(index + 1);
		cell.value = header;
		cell.font = { bold: true, size: 9 };
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF000000' },
		};
		cell.font = {
			bold: true,
			size: 9,
			color: { argb: 'FFFFFFFF' },
		};
		cell.alignment = {
			vertical: 'middle',
			horizontal: 'center',
			wrapText: true,
		};
		cell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' },
		};
	});

	let headerCol = 4;
	data.assessments.forEach(() => {
		worksheet.mergeCells(headerRow, headerCol, headerRow, headerCol + 1);
		headerCol += 2;
	});
	worksheet.mergeCells(headerRow, headerCol, headerRow, headerCol + 1);

	const subHeaderRow = headerRow + 1;
	const baseSubHeaders = ['', '', ''];
	const fullSubHeaders = [
		...baseSubHeaders,
		...assessmentWeights,
		'40.00%',
		'Grade',
	];

	const subHeaderRowCells = worksheet.getRow(subHeaderRow);
	fullSubHeaders.forEach((header, index) => {
		const cell = subHeaderRowCells.getCell(index + 1);
		cell.value = header;
		cell.font = { bold: true, size: 9 };
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF000000' },
		};
		cell.font = {
			bold: true,
			size: 9,
			color: { argb: 'FFFFFFFF' },
		};
		cell.alignment = { vertical: 'middle', horizontal: 'center' };
		cell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' },
		};
	});

	const dataStartRow = subHeaderRow + 1;
	data.students.forEach((student, index) => {
		const row = worksheet.getRow(dataStartRow + index);

		row.getCell(1).value = index + 1;
		row.getCell(2).value = student.name;
		row.getCell(3).value = student.stdNo;

		let currentCol = 4;
		data.assessments.forEach((assessment) => {
			const mark = data.assessmentMarks.find(
				(m) => m.stdNo === student.stdNo && m.assessmentId === assessment.id
			);

			const scoreCell = row.getCell(currentCol);
			scoreCell.value = mark ? mark.marks : '';

			const weightedValue = mark
				? ((mark.marks / assessment.totalMarks) * assessment.weight).toFixed(1)
				: '';
			const weightedCell = row.getCell(currentCol + 1);
			weightedCell.value = weightedValue;

			currentCol += 2;
		});

		const moduleGrade = data.moduleGrades.find(
			(g) => g.stdNo === student.stdNo
		);

		const totalCell = row.getCell(currentCol);
		totalCell.value = moduleGrade ? moduleGrade.weightedTotal : '';
		totalCell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFFFFF00' },
		};

		const gradeCell = row.getCell(currentCol + 1);
		gradeCell.value = moduleGrade ? moduleGrade.grade : '';
		gradeCell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFFFFF00' },
		};

		for (let i = 1; i <= currentCol + 1; i++) {
			const cell = row.getCell(i);
			cell.alignment = { vertical: 'middle', horizontal: 'center' };
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' },
			};
			if (i === 2) {
				cell.alignment = { vertical: 'middle', horizontal: 'left' };
			}
			cell.font = { size: 9 };
		}
	});

	worksheet.getColumn(1).width = 5;
	worksheet.getColumn(2).width = 25;
	worksheet.getColumn(3).width = 15;

	let colWidthIndex = 4;
	data.assessments.forEach(() => {
		worksheet.getColumn(colWidthIndex).width = 10;
		worksheet.getColumn(colWidthIndex + 1).width = 8;
		colWidthIndex += 2;
	});
	worksheet.getColumn(colWidthIndex).width = 10;
	worksheet.getColumn(colWidthIndex + 1).width = 8;

	const buffer = await workbook.xlsx.writeBuffer();
	const blob = new Blob([buffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});

	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `${data.moduleCode}_${data.className}_MarkSheet.xlsx`;
	link.click();
	window.URL.revokeObjectURL(url);
}
