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
