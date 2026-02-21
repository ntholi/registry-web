import ExcelJS from 'exceljs';
import type { ProgramDemandRow, SchoolDemandRow } from './repository';

export async function createProgramDemandExcel(
	demand: ProgramDemandRow[],
	bySchool: SchoolDemandRow[]
): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();

	const ws1 = wb.addWorksheet('Program Ranking');
	ws1.columns = [
		{ header: 'Program', key: 'program', width: 45 },
		{ header: 'Level', key: 'level', width: 15 },
		{ header: 'School', key: 'school', width: 40 },
		{ header: '1st Choice', key: 'first', width: 14 },
		{ header: '2nd Choice', key: 'second', width: 14 },
		{ header: 'Total', key: 'total', width: 12 },
	];
	const h1 = ws1.getRow(1);
	h1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	h1.fill = {
		type: 'pattern' as const,
		pattern: 'solid' as const,
		fgColor: { argb: 'FF4472C4' },
	};
	for (const r of demand) {
		ws1.addRow({
			program: r.programName,
			level: r.programLevel,
			school: r.schoolName,
			first: r.firstChoice,
			second: r.secondChoice,
			total: r.total,
		});
	}

	const ws2 = wb.addWorksheet('School Demand');
	ws2.columns = [
		{ header: 'School', key: 'school', width: 40 },
		{ header: 'Applications', key: 'count', width: 16 },
	];
	const h2 = ws2.getRow(1);
	h2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	h2.fill = {
		type: 'pattern' as const,
		pattern: 'solid' as const,
		fgColor: { argb: 'FF4472C4' },
	};
	for (const r of bySchool) {
		ws2.addRow({ school: r.schoolName, count: r.count });
	}

	const buffer = await wb.xlsx.writeBuffer();
	return Buffer.from(buffer);
}
