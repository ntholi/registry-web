import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { AdmissionReportFilter } from '../../_shared/types';
import { createQualificationsExcel } from './excel';
import { AcademicQualificationsRepository } from './repository';

export class AcademicQualificationsService {
	private repository = new AcademicQualificationsRepository();

	async getCertificateTypeDistribution(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getCertificateTypeDistribution(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async getGradeDistribution(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getGradeDistribution(filter),
			['registry', 'marketing', 'admin']
		);
	}

	async getResultClassification(filter: AdmissionReportFilter) {
		return withAuth(
			async () => this.repository.getResultClassification(filter),
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
			const [certs, grades, classifications, originSchools] = await Promise.all(
				[
					this.repository.getCertificateTypeDistribution(filter),
					this.repository.getGradeDistribution(filter),
					this.repository.getResultClassification(filter),
					this.repository.getTopOriginSchools(filter),
				]
			);
			return createQualificationsExcel(
				certs,
				grades,
				classifications,
				originSchools
			);
		}, ['registry', 'marketing', 'admin']);
	}
}

export const academicQualificationsService = serviceWrapper(
	AcademicQualificationsService,
	'AcademicQualificationsService'
);
