'use server';

import { getAllSponsors } from '@finance/sponsors/_server/actions';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import type { GraduationReportFilter } from '../_lib/types';
import { graduationReportService } from './service';

export const generateSummaryGraduationReport = createAction(
	async (filter?: GraduationReportFilter) => {
		const buffer =
			await graduationReportService.generateSummaryGraduationReport(filter);
		return Buffer.from(buffer).toString('base64');
	}
);

export const generateGraduatesListReport = createAction(
	async (filter?: GraduationReportFilter) => {
		const buffer =
			await graduationReportService.generateStudentsListReport(filter);
		return Buffer.from(buffer).toString('base64');
	}
);

export const getGraduationDataPreview = createAction(
	async (filter?: GraduationReportFilter) => {
		return graduationReportService.getGraduationDataPreview(filter);
	}
);

export const getPaginatedGraduationStudents = createAction(
	async (
		page: number = 1,
		pageSize: number = 20,
		filter?: GraduationReportFilter
	) => {
		return graduationReportService.getPaginatedGraduationStudents(
			page,
			pageSize,
			filter
		);
	}
);

export const getGraduationChartData = createAction(
	async (filter?: GraduationReportFilter) => {
		return graduationReportService.getChartData(filter);
	}
);

export const getGraduationDates = createAction(async () => {
	return graduationReportService.getGraduationDates();
});

export const getAvailableSponsorsForGraduations = createAction(async () => {
	return unwrap(await getAllSponsors());
});

export const getAvailableCountriesForGraduations = createAction(async () => {
	return graduationReportService.getAvailableCountries();
});
