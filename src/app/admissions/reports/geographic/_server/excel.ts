import ExcelJS from 'exceljs';
import type { CountryAggregation, LocationAggregation } from './repository';

export async function createGeographicExcel(
	countries: CountryAggregation[],
	locations: LocationAggregation[]
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

	const locationSheet = wb.addWorksheet('By Location');
	locationSheet.columns = [
		{ header: 'Location', key: 'city', width: 30 },
		{ header: 'Applications', key: 'count', width: 15 },
	];
	const locationHeader = locationSheet.getRow(1);
	locationHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	locationHeader.fill = {
		type: 'pattern' as const,
		pattern: 'solid' as const,
		fgColor: { argb: 'FF4472C4' },
	};
	for (const l of locations) {
		locationSheet.addRow({ city: l.city, count: l.count });
	}

	const buffer = await wb.xlsx.writeBuffer();
	return Buffer.from(buffer);
}
