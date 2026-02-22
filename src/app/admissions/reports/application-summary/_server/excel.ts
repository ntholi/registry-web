import ExcelJS from 'exceljs';
import type { SummaryRow } from './repository';

const STATUSES = [
	'draft',
	'submitted',
	'under_review',
	'accepted_first_choice',
	'accepted_second_choice',
	'rejected',
	'waitlisted',
] as const;

const STATUS_LABELS: Record<string, string> = {
	draft: 'Draft',
	submitted: 'Submitted',
	under_review: 'Under Review',
	accepted_first_choice: 'Accepted (1st)',
	accepted_second_choice: 'Accepted (2nd)',
	rejected: 'Rejected',
	waitlisted: 'Waitlisted',
};

export async function createApplicationSummaryExcel(
	data: SummaryRow[]
): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet('Application Summary');

	ws.columns = [
		{ header: 'School', key: 'school', width: 40 },
		{ header: 'Program', key: 'program', width: 45 },
		{ header: 'Level', key: 'level', width: 15 },
		...STATUSES.map((s) => ({
			header: STATUS_LABELS[s],
			key: s,
			width: 16,
		})),
		{ header: 'Total', key: 'total', width: 12 },
	];

	const headerRow = ws.getRow(1);
	headerRow.font = { bold: true };
	headerRow.fill = {
		type: 'pattern' as const,
		pattern: 'solid' as const,
		fgColor: { argb: 'FF4472C4' },
	};
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

	for (const row of data) {
		ws.addRow({
			school: row.schoolName,
			program: row.programName,
			level: row.programLevel,
			...Object.fromEntries(STATUSES.map((s) => [s, row.counts[s]])),
			total: row.counts.total,
		});
	}

	const totalRow = ws.addRow({
		school: 'TOTAL',
		program: '',
		level: '',
		...Object.fromEntries(
			STATUSES.map((s) => [s, data.reduce((sum, r) => sum + r.counts[s], 0)])
		),
		total: data.reduce((sum, r) => sum + r.counts.total, 0),
	});
	totalRow.font = { bold: true };

	const buffer = await wb.xlsx.writeBuffer();
	return Buffer.from(buffer);
}
