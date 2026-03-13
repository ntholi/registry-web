import { Packer } from 'docx';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { GraduationReportFilter } from '../_lib/types';
import { createGraduationSummaryDocument } from './document';
import { createGraduationExcel } from './excel';
import { GraduationReportRepository } from './repository';

export class GraduationReportService {
	private repository = new GraduationReportRepository();

	async generateSummaryGraduationReport(
		filter?: GraduationReportFilter
	): Promise<Buffer> {
		return withPermission(
			async () => {
				const reportData =
					await this.repository.getSummaryGraduationData(filter);
				const document = createGraduationSummaryDocument(reportData);
				const buffer = await Packer.toBuffer(document);
				return Buffer.from(buffer);
			},
			{ 'reports-graduation': ['read'] }
		);
	}

	async generateStudentsListReport(
		filter?: GraduationReportFilter
	): Promise<Buffer> {
		return withPermission(
			async () => {
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
			},
			{ 'reports-graduation': ['read'] }
		);
	}

	async getGraduationDataPreview(filter?: GraduationReportFilter) {
		return withPermission(
			async () => {
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
			},
			{ 'reports-graduation': ['read'] }
		);
	}

	async getPaginatedGraduationStudents(
		page: number = 1,
		pageSize: number = 20,
		filter?: GraduationReportFilter
	) {
		return withPermission(
			async () => {
				return this.repository.getPaginatedGraduationData(
					page,
					pageSize,
					filter
				);
			},
			{ 'reports-graduation': ['read'] }
		);
	}

	async getChartData(filter?: GraduationReportFilter) {
		return withPermission(
			async () => {
				return this.repository.getChartData(filter);
			},
			{ 'reports-graduation': ['read'] }
		);
	}

	async getGraduationDates() {
		return withPermission(
			async () => {
				return this.repository.getGraduationDates();
			},
			{ 'reports-graduation': ['read'] }
		);
	}

	async getAvailableCountries() {
		return withPermission(
			async () => {
				return this.repository.getAvailableCountries();
			},
			{ 'reports-graduation': ['read'] }
		);
	}
}

export const graduationReportService = serviceWrapper(
	GraduationReportService,
	'GraduationReportService'
);
