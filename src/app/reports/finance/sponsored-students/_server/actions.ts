'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import { createSponsoredStudentsExcel } from './excel';
import type { SponsoredStudentsReportFilter } from './repository';
import { sponsoredStudentsReportService } from './service';

export const getSponsoredStudentsReport = createAction(
	async (
		filter: SponsoredStudentsReportFilter,
		page: number = 1,
		pageSize: number = 20
	) => {
		return sponsoredStudentsReportService.getSponsoredStudents(
			filter,
			page,
			pageSize
		);
	}
);

export const getSponsoredStudentsSummary = createAction(
	async (filter: SponsoredStudentsReportFilter) => {
		return sponsoredStudentsReportService.getSummary(filter);
	}
);

export const exportSponsoredStudentsToExcel = createAction(
	async (filter: SponsoredStudentsReportFilter) => {
		const [students, termCode] = await Promise.all([
			sponsoredStudentsReportService.getAllSponsoredStudentsForExport(filter),
			sponsoredStudentsReportService.getTermCode(filter.termId),
		]);

		const buffer = await createSponsoredStudentsExcel(students, termCode);
		return Buffer.from(buffer).toString('base64');
	}
);
