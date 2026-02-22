import ExcelJS from 'exceljs';
import type { CountryAggregation, DistrictAggregation } from './repository';

export async function createGeographicExcel(
	countries: CountryAggregation[],
	districts: DistrictAggregation[]
): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();

	const countrySheet = wb.addWorksheet('By Country');
	countrySheet.columns = [
		{ header: 'Country', key: 'country', width: 30 },
		{ header: 'Applications', key: 'count', width: 15 },
	];
	const countryHeader = countrySheet.getRow(1);
	countryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	countryHeader.fill = {
		type: 'pattern' as const,
		pattern: 'solid' as const,
		fgColor: { argb: 'FF4472C4' },
	};
	for (const c of countries) {
		countrySheet.addRow(c);
	}

	const districtSheet = wb.addWorksheet('By District');
	districtSheet.columns = [
		{ header: 'District', key: 'district', width: 30 },
		{ header: 'Applications', key: 'count', width: 15 },
	];
	const districtHeader = districtSheet.getRow(1);
	districtHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	districtHeader.fill = {
		type: 'pattern' as const,
		pattern: 'solid' as const,
		fgColor: { argb: 'FF4472C4' },
	};
	for (const d of districts) {
		districtSheet.addRow(d);
	}

	const buffer = await wb.xlsx.writeBuffer();
	return Buffer.from(buffer);
}
