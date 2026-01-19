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

			const termCodes = terms.map((t) => t.code);
			return await this.repository.getDistributionData(type, termCodes, filter);
		}, ['registry', 'admin', 'finance', 'academic']);
	}
}

export const distributionReportService = serviceWrapper(
	DistributionReportService,
	'DistributionReportService'
);
