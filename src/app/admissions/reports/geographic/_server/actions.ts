'use server';

import type { AdmissionReportFilter } from '../../_shared/types';
import { geographicService } from './service';

export async function getGeographicCountryData(filter: AdmissionReportFilter) {
	return geographicService.getCountryData(filter);
}

export async function getGeographicLocationData(filter: AdmissionReportFilter) {
	return geographicService.getLocationData(filter);
}

export async function exportGeographicExcel(filter: AdmissionReportFilter) {
	const buffer = await geographicService.exportExcel(filter);
	return Buffer.from(buffer).toString('base64');
}
