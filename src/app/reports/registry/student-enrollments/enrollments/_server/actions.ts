'use server';

import { getAllSponsors } from '@finance/sponsors/_server/actions';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import type { RegistrationReportFilter } from './repository';
import { registrationReportService } from './service';

export const generateSummaryRegistrationReport = createAction(
	async (termIds: number[], filter?: RegistrationReportFilter) => {
		const buffer =
			await registrationReportService.generateSummaryRegistrationReport(
				termIds,
				filter
			);
		return Buffer.from(buffer).toString('base64');
	}
);

export const generateStudentsListReport = createAction(
	async (termIds: number[], filter?: RegistrationReportFilter) => {
		const buffer = await registrationReportService.generateStudentsListReport(
			termIds,
			filter
		);
		return Buffer.from(buffer).toString('base64');
	}
);

export const getRegistrationDataPreview = createAction(
	async (termIds: number[], filter?: RegistrationReportFilter) => {
		return registrationReportService.getRegistrationDataForTerms(
			termIds,
			filter
		);
	}
);

export const getPaginatedRegistrationStudents = createAction(
	async (
		termIds: number[],
		page: number = 1,
		pageSize: number = 20,
		filter?: RegistrationReportFilter
	) => {
		return registrationReportService.getPaginatedRegistrationStudents(
			termIds,
			page,
			pageSize,
			filter
		);
	}
);

export const getRegistrationChartData = createAction(
	async (termIds: number[], filter?: RegistrationReportFilter) => {
		return registrationReportService.getChartData(termIds, filter);
	}
);

export const getAvailableSponsorsForReports = createAction(async () => {
	return unwrap(await getAllSponsors());
});

export const getAvailableCountriesForReports = createAction(async () => {
	return registrationReportService.getAvailableCountries();
});
