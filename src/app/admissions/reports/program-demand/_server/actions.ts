'use server';

import type { AdmissionReportFilter } from '../../_shared/types';
import { programDemandService } from './service';

export async function getProgramDemandData(filter: AdmissionReportFilter) {
	return programDemandService.getProgramDemand(filter);
}

export async function getProgramDemandBySchool(filter: AdmissionReportFilter) {
	return programDemandService.getDemandBySchool(filter);
}

export async function exportProgramDemandExcel(filter: AdmissionReportFilter) {
	const buffer = await programDemandService.exportExcel(filter);
	return Buffer.from(buffer).toString('base64');
}
