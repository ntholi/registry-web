'use server';

import { getAllSponsors } from '@finance/sponsors/_server/actions';
import type { GraduationReportFilter } from '../_lib/types';
import { graduationReportService } from './service';

export async function generateSummaryGraduationReport(
	filter?: GraduationReportFilter
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

export async function generateGraduatesListReport(
	filter?: GraduationReportFilter
) {
	try {
		const buffer =
			await graduationReportService.generateStudentsListReport(filter);
		const base64Data = Buffer.from(buffer).toString('base64');
		return { success: true, data: base64Data };
	} catch (error) {
		console.error('Error generating graduates list report:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getGraduationDataPreview(
	filter?: GraduationReportFilter
) {
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
	filter?: GraduationReportFilter
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

export async function getGraduationChartData(filter?: GraduationReportFilter) {
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

export async function getGraduationDates() {
	try {
		const data = await graduationReportService.getGraduationDates();
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching graduation dates:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getAvailableSponsorsForGraduations() {
	try {
		const sponsors = await getAllSponsors();
		return { success: true, data: sponsors };
	} catch (error) {
		console.error('Error fetching available sponsors:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getAvailableCountriesForGraduations() {
	try {
		const countries = await graduationReportService.getAvailableCountries();
		return { success: true, data: countries };
	} catch (error) {
		console.error('Error fetching available countries:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
