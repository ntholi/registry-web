import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { AdmissionReportFilter } from '../../_shared/types';
import { createDemographicsExcel } from './excel';
import { DemographicsRepository } from './repository';

export class DemographicsService {
	private repository = new DemographicsRepository();

	async getOverview(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getOverview(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async getTopOriginSchools(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getTopOriginSchools(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async exportExcel(filter: AdmissionReportFilter): Promise<Buffer> {
		return withAuth(async () => {
			const overview = await this.repository.getOverview(filter);
			const originSchools = await this.repository.getTopOriginSchools(filter);
			return createDemographicsExcel(overview, originSchools);
		}, ['registry', 'marketing', 'admin']);
	}
}

export const demographicsService = serviceWrapper(
	DemographicsService,
	'DemographicsService'
);
