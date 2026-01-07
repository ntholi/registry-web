import { Packer } from 'docx';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { GraduationsFilter } from '../_lib/types';
import { createGraduationSummaryDocument } from './document';
import { createGraduationStudentsExcel } from './excel';
import { GraduationReportRepository } from './repository';

export class GraduationReportService {
	private repository = new GraduationReportRepository();

	async getGraduationDataPreview(filter?: GraduationsFilter) {
		return withAuth(async () => {
			const summaryData =
				await this.repository.getSummaryGraduationData(filter);
			const fullData = await this.repository.getFullGraduationData(filter);

			return {
				summaryData,
				fullData: {
					totalGraduates: fullData.length,
					students: fullData,
					generatedAt: new Date(),
				},
			};
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getPaginatedGraduationStudents(
		page: number = 1,
		pageSize: number = 20,
		filter?: GraduationsFilter
	) {
		return withAuth(async () => {
			return await this.repository.getPaginatedGraduationData(
				page,
				pageSize,
				filter
			);
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getChartData(filter?: GraduationsFilter) {
		return withAuth(async () => {
			return await this.repository.getChartData(filter);
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async generateSummaryGraduationReport(
		filter?: GraduationsFilter
	): Promise<Buffer> {
		return withAuth(async () => {
			const reportData =
				await this.repository.getSummaryGraduationData(filter);

			const document = createGraduationSummaryDocument(reportData);
			const buffer = await Packer.toBuffer(document);
			return Buffer.from(buffer);
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async generateStudentsListReport(filter?: GraduationsFilter): Promise<Buffer> {
		return withAuth(async () => {
			const summaryData =
				await this.repository.getSummaryGraduationData(filter);
			const fullData = await this.repository.getFullGraduationData(filter);

			const fullReport = {
				totalGraduates: fullData.length,
				students: fullData,
				generatedAt: new Date(),
			};

			const buffer = await createGraduationStudentsExcel(
				fullReport,
				summaryData,
				filter
			);
			return buffer;
		}, ['registry', 'admin', 'finance', 'academic']);
	}
}

export const graduationReportService = serviceWrapper(
	GraduationReportService,
	'GraduationReportService'
);
