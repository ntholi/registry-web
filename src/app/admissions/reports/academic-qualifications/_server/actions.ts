'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { AdmissionReportFilter } from '../../_shared/types';
import { academicQualificationsService } from './service';

export const getCertificateDistribution = createAction(
	async (filter: AdmissionReportFilter) => {
		return academicQualificationsService.getCertificateTypeDistribution(filter);
	}
);

export const getGradeDistribution = createAction(
	async (filter: AdmissionReportFilter) => {
		return academicQualificationsService.getGradeDistribution(filter);
	}
);

export const getResultClassification = createAction(
	async (filter: AdmissionReportFilter) => {
		return academicQualificationsService.getResultClassification(filter);
	}
);

export const getTopOriginSchools = createAction(
	async (filter: AdmissionReportFilter) => {
		return academicQualificationsService.getTopOriginSchools(filter);
	}
);

export const exportQualificationsExcel = createAction(
	async (filter: AdmissionReportFilter) => {
		const buffer = await academicQualificationsService.exportExcel(filter);
		return Buffer.from(buffer).toString('base64');
	}
);
