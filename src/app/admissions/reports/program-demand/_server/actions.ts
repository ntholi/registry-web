'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { AdmissionReportFilter } from '../../_shared/types';
import { programDemandService } from './service';

export const getProgramDemandData = createAction(
	async (filter: AdmissionReportFilter) => {
		return programDemandService.getProgramDemand(filter);
	}
);

export const getProgramDemandBySchool = createAction(
	async (filter: AdmissionReportFilter) => {
		return programDemandService.getDemandBySchool(filter);
	}
);

export const exportProgramDemandExcel = createAction(
	async (filter: AdmissionReportFilter) => {
		const buffer = await programDemandService.exportExcel(filter);
		return Buffer.from(buffer).toString('base64');
	}
);
