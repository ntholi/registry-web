'use server';

import type {
	ObservationReportData,
	ObservationReportFilter,
} from '../_lib/types';
import { generateObservationExcel } from './excel';
import { observationReportService } from './service';

export async function getObservationReportData(
	filter: ObservationReportFilter
) {
	return observationReportService.getReportData(filter);
}

export async function getObservationCyclesByTerm(termId: number) {
	return observationReportService.getCyclesByTerm(termId);
}

export async function exportObservationExcel(
	data: ObservationReportData,
	filter: ObservationReportFilter
) {
	const buffer = await generateObservationExcel(data, filter);
	return buffer.toString('base64');
}

export async function checkObservationReportAccess() {
	return observationReportService.hasFullAccess();
}
