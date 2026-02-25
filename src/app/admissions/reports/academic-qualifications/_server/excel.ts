import ExcelJS from 'exceljs';
import type {
	CertificateDistRow,
	ClassificationDistRow,
	GradeDistRow,
	OriginSchoolRow,
} from './repository';

export async function createQualificationsExcel(
	certs: CertificateDistRow[],
	grades: GradeDistRow[],
	classifications: ClassificationDistRow[],
	originSchools: OriginSchoolRow[]
): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();

	const applyHeader = (ws: ExcelJS.Worksheet) => {
		const row = ws.getRow(1);
		row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		row.fill = {
			type: 'pattern' as const,
			pattern: 'solid' as const,
			fgColor: { argb: 'FF4472C4' },
		};
	};

	const ws1 = wb.addWorksheet('Certificate Types');
	ws1.columns = [
		{ header: 'Certificate Type', key: 'name', width: 40 },
		{ header: 'Count', key: 'count', width: 14 },
	];
	applyHeader(ws1);
	for (const r of certs) {
		ws1.addRow({ name: r.certificateTypeName, count: r.count });
	}

	const ws2 = wb.addWorksheet('Grade Distribution');
	ws2.columns = [
		{ header: 'Grade', key: 'grade', width: 14 },
		{ header: 'Count', key: 'count', width: 14 },
	];
	applyHeader(ws2);
	for (const r of grades) {
		ws2.addRow({ grade: r.grade, count: r.count });
	}

	const ws3 = wb.addWorksheet('Classifications');
	ws3.columns = [
		{ header: 'Classification', key: 'classification', width: 20 },
		{ header: 'Count', key: 'count', width: 14 },
	];
	applyHeader(ws3);
	for (const r of classifications) {
		ws3.addRow({ classification: r.classification, count: r.count });
	}

	const ws4 = wb.addWorksheet('Origin Schools');
	ws4.columns = [
		{ header: 'School', key: 'name', width: 40 },
		{ header: 'Applicants', key: 'count', width: 14 },
	];
	applyHeader(ws4);
	for (const r of originSchools) {
		ws4.addRow(r);
	}

	const buffer = await wb.xlsx.writeBuffer();
	return Buffer.from(buffer);
}
