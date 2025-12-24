'use server';

import type { DistributionReportFilter, DistributionType } from '../types';
import { distributionReportService } from './service';

export async function getDistributionData(
	type: DistributionType,
	termIds: number[],
	filter?: DistributionReportFilter
) {
	try {
		const data = await distributionReportService.getDistributionData(
			type,
			termIds,
			filter
		);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching distribution data:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getDistributionTerms() {
	try {
		const terms = await distributionReportService.getAvailableTerms();
		return { success: true, data: terms };
	} catch (error) {
		console.error('Error fetching terms:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getDistributionSchools() {
	try {
		const schools = await distributionReportService.getAvailableSchools();
		return { success: true, data: schools };
	} catch (error) {
		console.error('Error fetching schools:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getDistributionPrograms(schoolId?: number) {
	try {
		const programs =
			await distributionReportService.getAvailablePrograms(schoolId);
		return { success: true, data: programs };
	} catch (error) {
		console.error('Error fetching programs:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
