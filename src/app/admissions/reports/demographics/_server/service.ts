import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { AdmissionReportFilter } from '../../_shared/types';
import { createDemographicsExcel } from './excel';
import { DemographicsRepository } from './repository';

export class DemographicsService {
	private repository = new DemographicsRepository();

	async getOverview(filter: AdmissionReportFilter) {
		return withPermission(async () => this.repository.getOverview(filter), {
			applications: ['read'],
		});
	}

	async exportExcel(filter: AdmissionReportFilter): Promise<Buffer> {
		return withPermission(
			async () => {
				const overview = await this.repository.getOverview(filter);
				return createDemographicsExcel(overview);
			},
			{ applications: ['read'] }
		);
	}
}

export const demographicsService = serviceWrapper(
	DemographicsService,
	'DemographicsService'
);
