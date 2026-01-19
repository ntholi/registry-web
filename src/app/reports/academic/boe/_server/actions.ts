'use server';

import type { BoeFilter } from './repository';
import { boeReportService } from './service';

export async function getPreview(filter: BoeFilter) {
	try {
		const data = await boeReportService.getPreview(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error getting BOE preview:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getStatistics(filter: BoeFilter) {
	try {
		const data = await boeReportService.getStatistics(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error getting BOE statistics:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getClassReports(filter: BoeFilter) {
	try {
		const data = await boeReportService.getClassReports(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error getting BOE class reports:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function generateExcel(filter: BoeFilter) {
	try {
		const buffer = await boeReportService.generateExcel(filter);
		const base64Data = Buffer.from(buffer).toString('base64');
		return { success: true, data: base64Data };
	} catch (error) {
		console.error('Error generating BOE report:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
