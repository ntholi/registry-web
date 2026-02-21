import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { AdmissionReportFilter } from '../../_shared/types';
import { createProgramDemandExcel } from './excel';
import { ProgramDemandRepository } from './repository';

export class ProgramDemandService {
	private repository = new ProgramDemandRepository();

	async getProgramDemand(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getProgramDemand(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async getDemandBySchool(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getDemandBySchool(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async exportExcel(filter: AdmissionReportFilter): Promise<Buffer> {
		return withAuth(async () => {
			const [demand, bySchool] = await Promise.all([
				this.repository.getProgramDemand(filter),
				this.repository.getDemandBySchool(filter),
			]);
			return createProgramDemandExcel(demand, bySchool);
		}, ['registry', 'marketing', 'admin']);
	}
}

export const programDemandService = serviceWrapper(
	ProgramDemandService,
	'ProgramDemandService'
);
