'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { AdmissionReportFilter } from '../../_shared/types';
import { demographicsService } from './service';

export const getDemographicsOverview = createAction(
	async (filter: AdmissionReportFilter) => {
		return demographicsService.getOverview(filter);
	}
);

export const exportDemographicsExcel = createAction(
	async (filter: AdmissionReportFilter) => {
		const buffer = await demographicsService.exportExcel(filter);
		return Buffer.from(buffer).toString('base64');
	}
);
