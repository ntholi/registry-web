import {
	type SponsoredStudentsReportFilter,
	sponsoredStudentsReportRepository,
} from './repository';

class SponsoredStudentsReportService {
	async getSponsoredStudents(
		filter: SponsoredStudentsReportFilter,
		page: number = 1,
		pageSize: number = 20
	) {
		return sponsoredStudentsReportRepository.getSponsoredStudents(
			filter,
			page,
			pageSize
		);
	}

	async getAllSponsoredStudentsForExport(
		filter: SponsoredStudentsReportFilter
	) {
		return sponsoredStudentsReportRepository.getAllSponsoredStudentsForExport(
			filter
		);
	}

	async getSummary(filter: SponsoredStudentsReportFilter) {
		return sponsoredStudentsReportRepository.getSummary(filter);
	}

	async getTermCode(termId: number) {
		return sponsoredStudentsReportRepository.getTermCode(termId);
	}
}

export const sponsoredStudentsReportService =
	new SponsoredStudentsReportService();
