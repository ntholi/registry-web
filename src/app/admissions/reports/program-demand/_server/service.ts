import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { AdmissionReportFilter } from '../../_shared/types';
import { createProgramDemandExcel } from './excel';
import { ProgramDemandRepository } from './repository';

export class ProgramDemandService {
	private repository = new ProgramDemandRepository();

	async getProgramDemand(filter: AdmissionReportFilter) {
		return withPermission(
			async () => this.repository.getProgramDemand(filter),
			{ applications: ['read'] }
		);
	}

	async getDemandBySchool(filter: AdmissionReportFilter) {
		return withPermission(
			async () => this.repository.getDemandBySchool(filter),
			{ applications: ['read'] }
		);
	}

	async exportExcel(filter: AdmissionReportFilter): Promise<Buffer> {
		return withPermission(
			async () => {
				const [demand, bySchool] = await Promise.all([
					this.repository.getProgramDemand(filter),
					this.repository.getDemandBySchool(filter),
				]);
				return createProgramDemandExcel(demand, bySchool);
			},
			{ applications: ['read'] }
		);
	}
}

export const programDemandService = serviceWrapper(
	ProgramDemandService,
	'ProgramDemandService'
);
