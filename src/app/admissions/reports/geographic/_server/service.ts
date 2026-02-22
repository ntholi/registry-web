import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { AdmissionReportFilter } from '../../_shared/types';
import { createGeographicExcel } from './excel';
import { GeographicRepository } from './repository';

export class GeographicService {
	private repository = new GeographicRepository();

	async getCountryData(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getCountryAggregation(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async getDistrictData(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getDistrictAggregation(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async exportExcel(filter: AdmissionReportFilter): Promise<Buffer> {
		return withAuth(async () => {
			const countries = await this.repository.getCountryAggregation(filter);
			const districts = await this.repository.getDistrictAggregation(filter);
			return createGeographicExcel(countries, districts);
		}, ['registry', 'marketing', 'admin']);
	}
}

export const geographicService = serviceWrapper(
	GeographicService,
	'GeographicService'
);
