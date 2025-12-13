import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { DistributionReportFilter, DistributionType } from '../types';
import { DistributionReportRepository } from './repository';

export class DistributionReportService {
	private repository = new DistributionReportRepository();

	async getDistributionData(
		type: DistributionType,
		termIds: number[],
		filter?: DistributionReportFilter
	) {
		return withAuth(async () => {
			const terms = await this.repository.getTermsByIds(termIds);
			if (!terms || terms.length === 0) {
				throw new Error('Terms not found');
			}

			const termNames = terms.map((t) => t.name);
			return await this.repository.getDistributionData(type, termNames, filter);
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getAvailableTerms() {
		return withAuth(async () => {
			return await this.repository.getAllActiveTerms();
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getAvailableSchools() {
		return withAuth(async () => {
			return await this.repository.getAvailableSchools();
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getAvailablePrograms(schoolId?: number) {
		return withAuth(async () => {
			return await this.repository.getAvailablePrograms(schoolId);
		}, ['registry', 'admin', 'finance', 'academic']);
	}
}

export const distributionReportService = serviceWrapper(
	DistributionReportService,
	'DistributionReportService'
);
