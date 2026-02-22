import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { AdmissionReportFilter } from '../../_shared/types';
import { createApplicationSummaryExcel } from './excel';
import { ApplicationSummaryRepository } from './repository';

export class ApplicationSummaryService {
	private repository = new ApplicationSummaryRepository();

	async getSummaryData(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getSummaryData(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async getChartData(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getChartData(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async exportExcel(filter: AdmissionReportFilter): Promise<Buffer> {
		return withAuth(async () => {
			const data = await this.repository.getSummaryData(filter);
			return createApplicationSummaryExcel(data);
		}, ['registry', 'marketing', 'admin']);
	}
}

export const applicationSummaryService = serviceWrapper(
	ApplicationSummaryService,
	'ApplicationSummaryService'
);
