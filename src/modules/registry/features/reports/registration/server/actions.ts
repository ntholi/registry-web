'use server';

import type { RegistrationReportFilter } from './repository';
import { registrationReportService } from './service';

export async function generateFullRegistrationReport(
	termId: number,
	filter?: RegistrationReportFilter
) {
	try {
		const buffer =
			await registrationReportService.generateFullRegistrationReport(
				termId,
				filter
			);
		const base64Data = Buffer.from(buffer).toString('base64');
		return { success: true, data: base64Data };
	} catch (error) {
		console.error('Error generating full registration report:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function generateSummaryRegistrationReport(
	termIds: number[],
	filter?: RegistrationReportFilter
) {
	try {
		const buffer =
			await registrationReportService.generateSummaryRegistrationReport(
				termIds,
				filter
			);
		const base64Data = Buffer.from(buffer).toString('base64');
		return { success: true, data: base64Data };
	} catch (error) {
		console.error('Error generating summary registration report:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function generateStudentsListReport(
	termIds: number[],
	filter?: RegistrationReportFilter
) {
	try {
		const buffer = await registrationReportService.generateStudentsListReport(
			termIds,
			filter
		);
		const base64Data = Buffer.from(buffer).toString('base64');
		return { success: true, data: base64Data };
	} catch (error) {
		console.error('Error generating students list report:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getAvailableTermsForReport() {
	try {
		const terms = await registrationReportService.getAvailableTerms();
		return { success: true, data: terms };
	} catch (error) {
		console.error('Error fetching available terms:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getRegistrationDataPreview(
	termIds: number[],
	filter?: RegistrationReportFilter
) {
	try {
		const data = await registrationReportService.getRegistrationDataForTerms(
			termIds,
			filter
		);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching registration data preview:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getPaginatedRegistrationStudents(
	termIds: number[],
	page: number = 1,
	pageSize: number = 20,
	filter?: RegistrationReportFilter
) {
	try {
		const data =
			await registrationReportService.getPaginatedRegistrationStudents(
				termIds,
				page,
				pageSize,
				filter
			);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching paginated registration students:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getAvailableSchoolsForReports() {
	try {
		const schools = await registrationReportService.getAvailableSchools();
		return { success: true, data: schools };
	} catch (error) {
		console.error('Error fetching available schools:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getAvailableProgramsForReports(schoolId?: number) {
	try {
		const programs =
			await registrationReportService.getAvailablePrograms(schoolId);
		return { success: true, data: programs };
	} catch (error) {
		console.error('Error fetching available programs:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getRegistrationChartData(
	termIds: number[],
	filter?: RegistrationReportFilter
) {
	try {
		const data = await registrationReportService.getChartData(termIds, filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching chart data:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getAvailableSponsorsForReports() {
	try {
		const sponsors = await registrationReportService.getAvailableSponsors();
		return { success: true, data: sponsors };
	} catch (error) {
		console.error('Error fetching available sponsors:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getAvailableCountriesForReports() {
	try {
		const countries = await registrationReportService.getAvailableCountries();
		return { success: true, data: countries };
	} catch (error) {
		console.error('Error fetching available countries:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
