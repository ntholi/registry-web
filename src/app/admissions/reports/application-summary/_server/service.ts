import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { AdmissionReportFilter } from '../../_shared/types';
import { createApplicationSummaryExcel } from './excel';
import { ApplicationSummaryRepository } from './repository';

export class ApplicationSummaryService {
	private repository = new ApplicationSummaryRepository();

	async getSummaryData(filter: AdmissionReportFilter) {
		return withPermission(async () => this.repository.getSummaryData(filter), {
			applications: ['read'],
		});
	}

	async getChartData(filter: AdmissionReportFilter) {
		return withPermission(async () => this.repository.getChartData(filter), {
			applications: ['read'],
		});
	}

	async exportExcel(filter: AdmissionReportFilter): Promise<Buffer> {
		return withPermission(
			async () => {
				const data = await this.repository.getSummaryData(filter);
				return createApplicationSummaryExcel(data);
			},
			{ applications: ['read'] }
		);
	}
}

export const applicationSummaryService = serviceWrapper(
	ApplicationSummaryService,
	'ApplicationSummaryService'
);
