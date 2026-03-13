import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { AdmissionReportFilter } from '../../_shared/types';
import { createQualificationsExcel } from './excel';
import { AcademicQualificationsRepository } from './repository';

export class AcademicQualificationsService {
	private repository = new AcademicQualificationsRepository();

	async getCertificateTypeDistribution(filter: AdmissionReportFilter) {
		return withPermission(
			async () => this.repository.getCertificateTypeDistribution(filter),
			{ applications: ['read'] }
		);
	}

	async getGradeDistribution(filter: AdmissionReportFilter) {
		return withPermission(
			async () => this.repository.getGradeDistribution(filter),
			{ applications: ['read'] }
		);
	}

	async getResultClassification(filter: AdmissionReportFilter) {
		return withPermission(
			async () => this.repository.getResultClassification(filter),
			{ applications: ['read'] }
		);
	}

	async getTopOriginSchools(filter: AdmissionReportFilter) {
		return withPermission(
			async () => this.repository.getTopOriginSchools(filter),
			{ applications: ['read'] }
		);
	}

	async exportExcel(filter: AdmissionReportFilter): Promise<Buffer> {
		return withPermission(
			async () => {
				const [certs, grades, classifications, originSchools] =
					await Promise.all([
						this.repository.getCertificateTypeDistribution(filter),
						this.repository.getGradeDistribution(filter),
						this.repository.getResultClassification(filter),
						this.repository.getTopOriginSchools(filter),
					]);
				return createQualificationsExcel(
					certs,
					grades,
					classifications,
					originSchools
				);
			},
			{ applications: ['read'] }
		);
	}
}

export const academicQualificationsService = serviceWrapper(
	AcademicQualificationsService,
	'AcademicQualificationsService'
);
