'use server';

import type { BoeFilter } from './repository';
import { boeReportService } from './service';

export async function getBoePreview(filter: BoeFilter) {
	try {
		const data = await boeReportService.getBoePreviewData(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error getting BOE preview:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getBoeClassReports(filter: BoeFilter) {
	try {
		const data = await boeReportService.getBoeClassReports(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error getting BOE class reports:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function generateBoeReport(filter: BoeFilter) {
	try {
		const buffer = await boeReportService.generateBoeReportWithFilter(filter);
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
