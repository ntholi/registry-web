import ExcelJS from 'exceljs';
import type { DemographicsOverview } from './repository';

export async function createDemographicsExcel(
	overview: DemographicsOverview
): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();

	const genderSheet = wb.addWorksheet('Gender');
	genderSheet.columns = [
		{ header: 'Gender', key: 'name', width: 20 },
		{ header: 'Count', key: 'value', width: 15 },
	];
	const genderHeader = genderSheet.getRow(1);
	genderHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	genderHeader.fill = {
		type: 'pattern' as const,
		pattern: 'solid' as const,
		fgColor: { argb: 'FF4472C4' },
	};
	for (const g of overview.gender) {
		genderSheet.addRow(g);
	}

	const natSheet = wb.addWorksheet('Nationality');
	natSheet.columns = [
		{ header: 'Nationality', key: 'name', width: 30 },
		{ header: 'Count', key: 'value', width: 15 },
	];
	const natHeader = natSheet.getRow(1);
	natHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	natHeader.fill = {
		type: 'pattern' as const,
		pattern: 'solid' as const,
		fgColor: { argb: 'FF4472C4' },
	};
	for (const n of overview.nationality) {
		natSheet.addRow(n);
	}

	const ageSheet = wb.addWorksheet('Age Groups');
	ageSheet.columns = [
		{ header: 'Age Group', key: 'name', width: 20 },
		{ header: 'Count', key: 'value', width: 15 },
	];
	const ageHeader = ageSheet.getRow(1);
	ageHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	ageHeader.fill = {
		type: 'pattern' as const,
		pattern: 'solid' as const,
		fgColor: { argb: 'FF4472C4' },
	};
	for (const a of overview.ageGroup) {
		ageSheet.addRow(a);
	}

	const buffer = await wb.xlsx.writeBuffer();
	return Buffer.from(buffer);
}
