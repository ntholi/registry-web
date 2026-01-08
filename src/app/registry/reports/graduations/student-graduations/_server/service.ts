import { Packer } from 'docx';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { GraduationReportFilter } from '../_lib/types';
import { createGraduationSummaryDocument } from './document';
import { createGraduationExcel } from './excel';
import { GraduationReportRepository } from './repository';

export class GraduationReportService {
	private repository = new GraduationReportRepository();

	async generateSummaryGraduationReport(
		filter?: GraduationReportFilter
	): Promise<Buffer> {
		return withAuth(async () => {
			const reportData = await this.repository.getSummaryGraduationData(filter);
			const document = createGraduationSummaryDocument(reportData);
			const buffer = await Packer.toBuffer(document);
			return Buffer.from(buffer);
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async generateStudentsListReport(
		filter?: GraduationReportFilter
	): Promise<Buffer> {
		return withAuth(async () => {
			const reportData = await this.repository.getFullGraduationData(filter);
			const summaryData =
				await this.repository.getSummaryGraduationData(filter);

			const fullReport = {
				graduationDate: filter?.graduationMonth || 'All Dates',
				totalGraduates: reportData.length,
				students: reportData,
				generatedAt: new Date(),
			};

			const buffer = await createGraduationExcel(
				fullReport,
				summaryData,
				filter
			);
			return buffer;
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getGraduationDataPreview(filter?: GraduationReportFilter) {
		return withAuth(async () => {
			const fullData = await this.repository.getFullGraduationData(filter);
			const summaryData =
				await this.repository.getSummaryGraduationData(filter);

			return {
				fullData: {
					graduationDate: filter?.graduationMonth || 'All Dates',
					totalGraduates: fullData.length,
					students: fullData,
					generatedAt: new Date(),
				},
				summaryData,
			};
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getPaginatedGraduationStudents(
		page: number = 1,
		pageSize: number = 20,
		filter?: GraduationReportFilter
	) {
		return withAuth(async () => {
			return this.repository.getPaginatedGraduationData(page, pageSize, filter);
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getChartData(filter?: GraduationReportFilter) {
		return withAuth(async () => {
			return this.repository.getChartData(filter);
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getGraduationDates() {
		return withAuth(async () => {
			return this.repository.getGraduationDates();
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getAvailableCountries() {
		return withAuth(async () => {
			return this.repository.getAvailableCountries();
		}, ['registry', 'admin', 'finance', 'academic']);
	}
}

export const graduationReportService = serviceWrapper(
	GraduationReportService,
	'GraduationReportService'
);
