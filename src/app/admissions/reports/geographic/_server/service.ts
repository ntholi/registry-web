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

	async getLocationData(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getLocationAggregation(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async exportExcel(filter: AdmissionReportFilter): Promise<Buffer> {
		return withAuth(async () => {
			const countries = await this.repository.getCountryAggregation(filter);
			const locations = await this.repository.getLocationAggregation(filter);
			return createGeographicExcel(countries, locations);
		}, ['registry', 'marketing', 'admin']);
	}
}

export const geographicService = serviceWrapper(
	GeographicService,
	'GeographicService'
);
