import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { AdmissionReportFilter } from '../../_shared/types';
import { createGeographicExcel } from './excel';
import { GeographicRepository } from './repository';

export class GeographicService {
	private repository = new GeographicRepository();

	async getCountryData(filter: AdmissionReportFilter) {
		return withPermission(
			async () => this.repository.getCountryAggregation(filter),
			{ applications: ['read'] }
		);
	}

	async getLocationData(filter: AdmissionReportFilter) {
		return withPermission(
			async () => this.repository.getLocationAggregation(filter),
			{ applications: ['read'] }
		);
	}

	async exportExcel(filter: AdmissionReportFilter): Promise<Buffer> {
		return withPermission(
			async () => {
				const countries = await this.repository.getCountryAggregation(filter);
				const locations = await this.repository.getLocationAggregation(filter);
				return createGeographicExcel(countries, locations);
			},
			{ applications: ['read'] }
		);
	}
}

export const geographicService = serviceWrapper(
	GeographicService,
	'GeographicService'
);
