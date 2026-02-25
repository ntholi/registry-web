'use server';

import type { AdmissionReportFilter } from '../../_shared/types';
import { demographicsService } from './service';

export async function getDemographicsOverview(filter: AdmissionReportFilter) {
	return demographicsService.getOverview(filter);
}

export async function getTopOriginSchools(filter: AdmissionReportFilter) {
	return demographicsService.getTopOriginSchools(filter);
}

export async function exportDemographicsExcel(filter: AdmissionReportFilter) {
	const buffer = await demographicsService.exportExcel(filter);
	return Buffer.from(buffer).toString('base64');
}
