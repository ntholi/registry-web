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
	termId: number,
	filter?: RegistrationReportFilter
) {
	try {
		const buffer =
			await registrationReportService.generateSummaryRegistrationReport(
				termId,
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
	termId: number,
	filter?: RegistrationReportFilter
) {
	try {
		const buffer = await registrationReportService.generateStudentsListReport(
			termId,
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
	termId: number,
	filter?: RegistrationReportFilter
) {
	try {
		const data = await registrationReportService.getRegistrationDataForTerm(
			termId,
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
	termId: number,
	page: number = 1,
	pageSize: number = 20,
	filter?: RegistrationReportFilter
) {
	try {
		const data =
			await registrationReportService.getPaginatedRegistrationStudents(
				termId,
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
