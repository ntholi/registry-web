'use server';

import { createSponsoredStudentsExcel } from './excel';
import type { SponsoredStudentsReportFilter } from './repository';
import { sponsoredStudentsReportService } from './service';

export async function getSponsoredStudentsReport(
	filter: SponsoredStudentsReportFilter,
	page: number = 1,
	pageSize: number = 20
) {
	try {
		const data = await sponsoredStudentsReportService.getSponsoredStudents(
			filter,
			page,
			pageSize
		);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching sponsored students report:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getSponsoredStudentsSummary(
	filter: SponsoredStudentsReportFilter
) {
	try {
		const data = await sponsoredStudentsReportService.getSummary(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching sponsored students summary:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function exportSponsoredStudentsToExcel(
	filter: SponsoredStudentsReportFilter
) {
	try {
		const [students, termCode] = await Promise.all([
			sponsoredStudentsReportService.getAllSponsoredStudentsForExport(filter),
			sponsoredStudentsReportService.getTermCode(filter.termId),
		]);

		const buffer = await createSponsoredStudentsExcel(students, termCode);
		const base64Data = Buffer.from(buffer).toString('base64');

		return { success: true, data: base64Data };
	} catch (error) {
		console.error('Error exporting sponsored students to Excel:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
