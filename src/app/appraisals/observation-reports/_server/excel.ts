'use server';

import ExcelJS from 'exceljs';
import type {
	ObservationReportData,
	ObservationReportFilter,
} from '../_lib/types';
import { observationReportService } from './service';

export async function generateObservationExcel(
	data: ObservationReportData,
	filter: ObservationReportFilter
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'Registry Web';
	workbook.created = new Date();

	addSummarySheet(workbook, data);
	addLecturerRankingsSheet(workbook, data);
	addCategoryAveragesSheet(workbook, data);
	await addDetailedRatingsSheet(workbook, filter);

	const buffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(buffer);
}

function styleHeaderRow(sheet: ExcelJS.Worksheet) {
	const headerRow = sheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF2B579A' },
	};
	headerRow.alignment = { horizontal: 'center' };
}

function addSummarySheet(
	workbook: ExcelJS.Workbook,
	data: ObservationReportData
) {
	const sheet = workbook.addWorksheet('Summary');

	sheet.columns = [
		{ header: 'Metric', key: 'metric', width: 30 },
		{ header: 'Value', key: 'value', width: 20 },
	];
	styleHeaderRow(sheet);

	sheet.addRow({
		metric: 'Total Observations',
		value: data.overview.totalObservations,
	});
	sheet.addRow({ metric: 'Average Score', value: data.overview.avgScore });
	sheet.addRow({
		metric: 'Lecturers Evaluated',
		value: data.overview.lecturersEvaluated,
	});
	sheet.addRow({
		metric: 'Acknowledgment Rate (%)',
		value: data.overview.acknowledgmentRate,
	});

	sheet.addRow({});
	sheet.addRow({ metric: 'Category Averages', value: '' });

	for (const cat of data.categoryAverages) {
		sheet.addRow({
			metric: `[${cat.section}] ${cat.categoryName}`,
			value: cat.avgRating,
		});
	}

	if (data.trendData.length > 0) {
		sheet.addRow({});
		sheet.addRow({ metric: 'Trend (by Term)', value: '' });
		for (const t of data.trendData) {
			sheet.addRow({
				metric: t.termCode,
				value: `${t.avgScore} (${t.observationCount} obs)`,
			});
		}
	}
}

function addLecturerRankingsSheet(
	workbook: ExcelJS.Workbook,
	data: ObservationReportData
) {
	const sheet = workbook.addWorksheet('Lecturer Scores');

	const categoryNames = data.categoryAverages.map((c) => c.categoryName);

	const columns: Partial<ExcelJS.Column>[] = [
		{ header: 'Rank', key: 'rank', width: 8 },
		{ header: 'Lecturer', key: 'lecturer', width: 30 },
		{ header: 'School', key: 'school', width: 15 },
		{ header: 'Observations', key: 'observations', width: 14 },
		{ header: 'Avg Score', key: 'avgScore', width: 12 },
	];

	for (const cat of categoryNames) {
		columns.push({ header: cat, key: cat, width: 20 });
	}

	sheet.columns = columns;
	styleHeaderRow(sheet);

	data.lecturerRankings.forEach((lecturer, idx) => {
		const row: Record<string, string | number> = {
			rank: idx + 1,
			lecturer: lecturer.lecturerName,
			school: lecturer.schoolCode,
			observations: lecturer.observationCount,
			avgScore: lecturer.avgScore,
		};
		for (const cat of categoryNames) {
			row[cat] = lecturer.categoryAverages[cat] ?? 0;
		}
		sheet.addRow(row);
	});
}

function addCategoryAveragesSheet(
	workbook: ExcelJS.Workbook,
	data: ObservationReportData
) {
	const sheet = workbook.addWorksheet('Category Averages');

	sheet.columns = [
		{ header: 'Section', key: 'section', width: 25 },
		{ header: 'Category', key: 'category', width: 35 },
		{ header: 'Avg Rating', key: 'avgRating', width: 12 },
		{ header: 'Ratings Count', key: 'ratingCount', width: 14 },
	];
	styleHeaderRow(sheet);

	for (const cat of data.categoryAverages) {
		sheet.addRow({
			section: cat.section,
			category: cat.categoryName,
			avgRating: cat.avgRating,
			ratingCount: cat.ratingCount,
		});
	}
}

async function addDetailedRatingsSheet(
	workbook: ExcelJS.Workbook,
	filter: ObservationReportFilter
) {
	const rows = await observationReportService.getDetailedExportData(filter);

	const sheet = workbook.addWorksheet('Detailed Ratings');

	sheet.columns = [
		{ header: 'Lecturer', key: 'lecturer', width: 25 },
		{ header: 'School', key: 'school', width: 12 },
		{ header: 'Program', key: 'program', width: 12 },
		{ header: 'Module Code', key: 'moduleCode', width: 15 },
		{ header: 'Module', key: 'module', width: 30 },
		{ header: 'Cycle', key: 'cycle', width: 20 },
		{ header: 'Section', key: 'section', width: 22 },
		{ header: 'Category', key: 'category', width: 30 },
		{ header: 'Criterion', key: 'criterion', width: 40 },
		{ header: 'Rating', key: 'rating', width: 8 },
		{ header: 'Status', key: 'status', width: 14 },
	];
	styleHeaderRow(sheet);

	for (const row of rows) {
		sheet.addRow({
			lecturer: row.lecturerName,
			school: row.schoolCode,
			program: row.programCode,
			moduleCode: row.moduleCode,
			module: row.moduleName,
			cycle: row.cycleName,
			section: row.section,
			category: row.categoryName,
			criterion: row.criterionText,
			rating: row.rating,
			status: row.status,
		});
	}
}
