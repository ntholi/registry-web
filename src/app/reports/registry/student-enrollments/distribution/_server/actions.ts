'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { DistributionReportFilter, DistributionType } from '../types';
import { distributionReportService } from './service';

export const getDistributionData = createAction(
	async (
		type: DistributionType,
		termIds: number[],
		filter?: DistributionReportFilter
	) => {
		return distributionReportService.getDistributionData(type, termIds, filter);
	}
);
