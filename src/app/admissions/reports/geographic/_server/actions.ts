'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { AdmissionReportFilter } from '../../_shared/types';
import { geographicService } from './service';

export const getGeographicCountryData = createAction(
	async (filter: AdmissionReportFilter) => {
		return geographicService.getCountryData(filter);
	}
);

export const getGeographicLocationData = createAction(
	async (filter: AdmissionReportFilter) => {
		return geographicService.getLocationData(filter);
	}
);

export const exportGeographicExcel = createAction(
	async (filter: AdmissionReportFilter) => {
		const buffer = await geographicService.exportExcel(filter);
		return Buffer.from(buffer).toString('base64');
	}
);
