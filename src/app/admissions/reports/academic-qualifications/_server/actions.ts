'use server';

import type { AdmissionReportFilter } from '../../_shared/types';
import { academicQualificationsService } from './service';

export async function getCertificateDistribution(
	filter: AdmissionReportFilter
) {
	return academicQualificationsService.getCertificateTypeDistribution(filter);
}

export async function getGradeDistribution(filter: AdmissionReportFilter) {
	return academicQualificationsService.getGradeDistribution(filter);
}

export async function getResultClassification(filter: AdmissionReportFilter) {
	return academicQualificationsService.getResultClassification(filter);
}

export async function exportQualificationsExcel(filter: AdmissionReportFilter) {
	const buffer = await academicQualificationsService.exportExcel(filter);
	return Buffer.from(buffer).toString('base64');
}
