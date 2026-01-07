'use server';

import type { GraduationsFilter } from '../_lib/types';
import { graduationReportService } from './service';

export async function getGraduationDataPreview(filter?: GraduationsFilter) {
	try {
		const data = await graduationReportService.getGraduationDataPreview(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching graduation data preview:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getPaginatedGraduationStudents(
	page: number = 1,
	pageSize: number = 20,
	filter?: GraduationsFilter
) {
	try {
		const data = await graduationReportService.getPaginatedGraduationStudents(
			page,
			pageSize,
			filter
		);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching paginated graduation students:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getGraduationChartData(filter?: GraduationsFilter) {
	try {
		const data = await graduationReportService.getChartData(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching chart data:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function generateSummaryGraduationReport(
	filter?: GraduationsFilter
) {
	try {
		const buffer =
			await graduationReportService.generateSummaryGraduationReport(filter);
		const base64Data = Buffer.from(buffer).toString('base64');
		return { success: true, data: base64Data };
	} catch (error) {
		console.error('Error generating summary graduation report:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function generateStudentsListReport(filter?: GraduationsFilter) {
	try {
		const buffer =
			await graduationReportService.generateStudentsListReport(filter);
		const base64Data = Buffer.from(buffer).toString('base64');
		return { success: true, data: base64Data };
	} catch (error) {
		console.error('Error generating students list report:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
