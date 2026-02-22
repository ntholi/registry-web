'use server';

import ExcelJS from 'exceljs';
import type { FeedbackReportData, FeedbackReportFilter } from '../_lib/types';
import { feedbackReportRepository } from './repository';

export async function generateFeedbackExcel(
	data: FeedbackReportData,
	filter: FeedbackReportFilter
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'Registry Web';
	workbook.created = new Date();

	addSummarySheet(workbook, data);
	addLecturerRankingsSheet(workbook, data);
	addPerQuestionSheet(workbook, data);
	await addLecturerDetailsSheet(workbook, data, filter);
	await addCommentsSheet(workbook, data, filter);

	const buffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(buffer);
}

function styleHeaderRow(sheet: ExcelJS.Worksheet) {
	const headerRow = sheet.getRow(1);
	headerRow.font = { bold: true, size: 11 };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF2B579A' },
	};
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
	headerRow.alignment = { horizontal: 'center' };
}

function addSummarySheet(workbook: ExcelJS.Workbook, data: FeedbackReportData) {
	const sheet = workbook.addWorksheet('Summary');

	sheet.columns = [
		{ header: 'Metric', key: 'metric', width: 30 },
		{ header: 'Value', key: 'value', width: 20 },
	];

	styleHeaderRow(sheet);

	sheet.addRow({
		metric: 'Total Responses',
		value: data.overview.totalResponses,
	});
	sheet.addRow({ metric: 'Average Rating', value: data.overview.avgRating });
	sheet.addRow({
		metric: 'Response Rate (%)',
		value: data.overview.responseRate,
	});
	sheet.addRow({
		metric: 'Lecturers Evaluated',
		value: data.overview.lecturersEvaluated,
	});

	sheet.addRow({});
	sheet.addRow({ metric: 'Category Averages', value: '' });

	for (const cat of data.categoryAverages) {
		sheet.addRow({ metric: cat.categoryName, value: cat.avgRating });
	}

	sheet.addRow({});
	sheet.addRow({ metric: 'Rating Distribution', value: '' });

	for (const dist of data.ratingDistribution) {
		sheet.addRow({
			metric: `${dist.rating} Star`,
			value: `${dist.count} (${dist.percentage}%)`,
		});
	}
}

function addLecturerRankingsSheet(
	workbook: ExcelJS.Workbook,
	data: FeedbackReportData
) {
	const sheet = workbook.addWorksheet('Lecturer Rankings');

	const categoryNames = data.categoryAverages.map((c) => c.categoryName);

	const columns: Partial<ExcelJS.Column>[] = [
		{ header: 'Rank', key: 'rank', width: 8 },
		{ header: 'Lecturer', key: 'lecturer', width: 30 },
		{ header: 'School', key: 'school', width: 15 },
		{ header: 'Modules', key: 'modules', width: 10 },
		{ header: 'Responses', key: 'responses', width: 12 },
		{ header: 'Avg Rating', key: 'avgRating', width: 12 },
	];

	for (const cat of categoryNames) {
		columns.push({ header: cat, key: cat, width: 18 });
	}

	sheet.columns = columns;
	styleHeaderRow(sheet);

	data.lecturerRankings.forEach((lecturer, idx) => {
		const row: Record<string, string | number> = {
			rank: idx + 1,
			lecturer: lecturer.lecturerName,
			school: lecturer.schoolCode,
			modules: lecturer.moduleCount,
			responses: lecturer.responseCount,
			avgRating: lecturer.avgRating,
		};
		for (const cat of categoryNames) {
			row[cat] = lecturer.categoryAverages[cat] ?? 0;
		}
		sheet.addRow(row);
	});
}

function addPerQuestionSheet(
	workbook: ExcelJS.Workbook,
	data: FeedbackReportData
) {
	const sheet = workbook.addWorksheet('Per-Question');

	sheet.columns = [
		{ header: 'Category', key: 'category', width: 25 },
		{ header: 'Question', key: 'question', width: 50 },
		{ header: 'Avg Rating', key: 'avgRating', width: 12 },
		{ header: 'Responses', key: 'responses', width: 12 },
		{ header: '1 Star', key: 'star1', width: 10 },
		{ header: '2 Stars', key: 'star2', width: 10 },
		{ header: '3 Stars', key: 'star3', width: 10 },
		{ header: '4 Stars', key: 'star4', width: 10 },
		{ header: '5 Stars', key: 'star5', width: 10 },
	];

	styleHeaderRow(sheet);

	for (const q of data.questionBreakdown) {
		sheet.addRow({
			category: q.categoryName,
			question: q.questionText,
			avgRating: q.avgRating,
			responses: q.responseCount,
			star1: q.distribution.find((d) => d.rating === 1)?.count ?? 0,
			star2: q.distribution.find((d) => d.rating === 2)?.count ?? 0,
			star3: q.distribution.find((d) => d.rating === 3)?.count ?? 0,
			star4: q.distribution.find((d) => d.rating === 4)?.count ?? 0,
			star5: q.distribution.find((d) => d.rating === 5)?.count ?? 0,
		});
	}
}

async function addLecturerDetailsSheet(
	workbook: ExcelJS.Workbook,
	data: FeedbackReportData,
	filter: FeedbackReportFilter
) {
	const sheet = workbook.addWorksheet('Lecturer Details');

	sheet.columns = [
		{ header: 'Lecturer', key: 'lecturer', width: 30 },
		{ header: 'Module Code', key: 'moduleCode', width: 15 },
		{ header: 'Module Name', key: 'moduleName', width: 30 },
		{ header: 'Avg Rating', key: 'avgRating', width: 12 },
		{ header: 'Responses', key: 'responses', width: 12 },
		{ header: 'Class', key: 'className', width: 15 },
	];

	styleHeaderRow(sheet);

	for (const lecturer of data.lecturerRankings) {
		const detail = await feedbackReportRepository.getLecturerDetail(
			lecturer.userId,
			filter
		);
		if (!detail) continue;

		for (const m of detail.modules) {
			sheet.addRow({
				lecturer: lecturer.lecturerName,
				moduleCode: m.moduleCode,
				moduleName: m.moduleName,
				avgRating: m.avgRating,
				responses: m.responseCount,
				className: m.className,
			});
		}
	}
}

async function addCommentsSheet(
	workbook: ExcelJS.Workbook,
	data: FeedbackReportData,
	filter: FeedbackReportFilter
) {
	const sheet = workbook.addWorksheet('Comments');

	sheet.columns = [
		{ header: 'Lecturer', key: 'lecturer', width: 30 },
		{ header: 'Module Code', key: 'moduleCode', width: 15 },
		{ header: 'Module Name', key: 'moduleName', width: 30 },
		{ header: 'Class', key: 'className', width: 15 },
		{ header: 'Comment', key: 'comment', width: 60 },
	];

	styleHeaderRow(sheet);

	for (const lecturer of data.lecturerRankings) {
		const detail = await feedbackReportRepository.getLecturerDetail(
			lecturer.userId,
			filter
		);
		if (!detail) continue;

		for (const c of detail.comments) {
			sheet.addRow({
				lecturer: lecturer.lecturerName,
				moduleCode: c.moduleCode,
				moduleName: c.moduleName,
				className: c.className,
				comment: c.comment,
			});
		}
	}
}
