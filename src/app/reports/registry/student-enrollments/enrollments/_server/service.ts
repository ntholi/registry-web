import { Packer } from 'docx';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { createSummaryRegistrationDocument } from './document';
import { createFullRegistrationExcel } from './excel';
import {
	type RegistrationReportFilter,
	RegistrationReportRepository,
} from './repository';

export class RegistrationReportService {
	private repository = new RegistrationReportRepository();

	async generateFullRegistrationReport(
		termId: number,
		filter?: RegistrationReportFilter
	): Promise<Buffer> {
		return withAuth(async () => {
			const term = await this.repository.getTermById(termId);
			if (!term) {
				throw new Error('Term not found');
			}

			const reportData = await this.repository.getFullRegistrationData(
				term.code,
				filter
			);
			const summaryData = await this.repository.getSummaryRegistrationData(
				term.code,
				filter
			);
			const fullReport = {
				termCode: term.code,
				totalStudents: reportData.length,
				students: reportData,
				generatedAt: new Date(),
			};
			const buffer = await createFullRegistrationExcel(fullReport, summaryData);
			return buffer;
		}, ['registry', 'admin', 'finance', 'academic', 'leap']);
	}

	async generateSummaryRegistrationReport(
		termIds: number[],
		filter?: RegistrationReportFilter
	): Promise<Buffer> {
		return withAuth(async () => {
			const terms = await this.repository.getTermsByIds(termIds);
			if (!terms || terms.length === 0) {
				throw new Error('Terms not found');
			}

			const termCodes = terms.map((t) => t.code);
			const reportData =
				await this.repository.getSummaryRegistrationDataForMultipleTerms(
					termCodes,
					filter
				);

			const document = createSummaryRegistrationDocument(reportData);
			const buffer = await Packer.toBuffer(document);
			return Buffer.from(buffer);
		}, ['registry', 'admin', 'finance', 'academic', 'leap']);
	}

	async generateStudentsListReport(
		termIds: number[],
		filter?: RegistrationReportFilter
	): Promise<Buffer> {
		return withAuth(async () => {
			const terms = await this.repository.getTermsByIds(termIds);
			if (!terms || terms.length === 0) {
				throw new Error('Terms not found');
			}

			const termCodes = terms.map((t) => t.code);
			const reportData =
				await this.repository.getFullRegistrationDataForMultipleTerms(
					termCodes,
					filter
				);
			const summaryData =
				await this.repository.getSummaryRegistrationDataForMultipleTerms(
					termCodes,
					filter
				);
			const fullReport = {
				termCode: terms.map((t) => t.code).join(', '),
				totalStudents: reportData.length,
				students: reportData,
				generatedAt: new Date(),
			};

			const buffer = await createFullRegistrationExcel(
				fullReport,
				summaryData,
				filter
			);
			return buffer;
		}, ['registry', 'admin', 'finance', 'academic', 'leap']);
	}

	async getRegistrationDataForTerms(
		termIds: number[],
		filter?: RegistrationReportFilter
	) {
		return withAuth(async () => {
			const terms = await this.repository.getTermsByIds(termIds);
			if (!terms || terms.length === 0) {
				throw new Error('Terms not found');
			}

			const termCodes = terms.map((t) => t.code);
			const fullData =
				await this.repository.getFullRegistrationDataForMultipleTerms(
					termCodes,
					filter
				);
			const summaryData =
				await this.repository.getSummaryRegistrationDataForMultipleTerms(
					termCodes,
					filter
				);

			return {
				terms,
				fullData: {
					termCode: terms.map((t) => t.code).join(', '),
					totalStudents: fullData.length,
					students: fullData,
					generatedAt: new Date(),
				},
				summaryData,
			};
		}, ['registry', 'admin', 'finance', 'academic', 'leap']);
	}

	async getPaginatedRegistrationStudents(
		termIds: number[],
		page: number = 1,
		pageSize: number = 20,
		filter?: RegistrationReportFilter
	) {
		return withAuth(async () => {
			const terms = await this.repository.getTermsByIds(termIds);
			if (!terms || terms.length === 0) {
				throw new Error('Terms not found');
			}

			const termCodes = terms.map((t) => t.code);
			return await this.repository.getPaginatedRegistrationDataForMultipleTerms(
				termCodes,
				page,
				pageSize,
				filter
			);
		}, ['registry', 'admin', 'finance', 'academic', 'leap']);
	}

	async getChartData(termIds: number[], filter?: RegistrationReportFilter) {
		return withAuth(async () => {
			const terms = await this.repository.getTermsByIds(termIds);
			if (!terms || terms.length === 0) {
				throw new Error('Terms not found');
			}

			const termCodes = terms.map((t) => t.code);
			return await this.repository.getChartDataForMultipleTerms(
				termCodes,
				filter
			);
		}, ['registry', 'admin', 'finance', 'academic', 'leap']);
	}

	async getAvailableCountries() {
		return withAuth(async () => {
			return await this.repository.getAvailableCountries();
		}, ['registry', 'admin', 'finance', 'academic', 'leap']);
	}
}

export const registrationReportService = serviceWrapper(
	RegistrationReportService,
	'RegistrationReportService'
);
