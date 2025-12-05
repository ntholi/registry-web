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
				term.name,
				filter
			);
			const summaryData = await this.repository.getSummaryRegistrationData(
				term.name,
				filter
			);
			const fullReport = {
				termName: term.name,
				totalStudents: reportData.length,
				students: reportData,
				generatedAt: new Date(),
			};
			const buffer = await createFullRegistrationExcel(fullReport, summaryData);
			return buffer;
		}, ['registry', 'admin', 'finance', 'academic']);
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

			const termNames = terms.map((t) => t.name);
			const reportData =
				await this.repository.getSummaryRegistrationDataForMultipleTerms(
					termNames,
					filter
				);

			const document = createSummaryRegistrationDocument(reportData);
			const buffer = await Packer.toBuffer(document);
			return Buffer.from(buffer);
		}, ['registry', 'admin', 'finance', 'academic']);
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

			const termNames = terms.map((t) => t.name);
			const reportData =
				await this.repository.getFullRegistrationDataForMultipleTerms(
					termNames,
					filter
				);
			const summaryData =
				await this.repository.getSummaryRegistrationDataForMultipleTerms(
					termNames,
					filter
				);
			const fullReport = {
				termName: terms.map((t) => t.name).join(', '),
				totalStudents: reportData.length,
				students: reportData,
				generatedAt: new Date(),
			};

			const buffer = await createFullRegistrationExcel(fullReport, summaryData);
			return buffer;
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getAvailableTerms() {
		return withAuth(async () => {
			return await this.repository.getAllActiveTerms();
		}, ['registry', 'admin', 'finance', 'academic']);
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

			const termNames = terms.map((t) => t.name);
			const fullData =
				await this.repository.getFullRegistrationDataForMultipleTerms(
					termNames,
					filter
				);
			const summaryData =
				await this.repository.getSummaryRegistrationDataForMultipleTerms(
					termNames,
					filter
				);

			return {
				terms,
				fullData: {
					termName: terms.map((t) => t.name).join(', '),
					totalStudents: fullData.length,
					students: fullData,
					generatedAt: new Date(),
				},
				summaryData,
			};
		}, ['registry', 'admin', 'finance', 'academic']);
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

			const termNames = terms.map((t) => t.name);
			return await this.repository.getPaginatedRegistrationDataForMultipleTerms(
				termNames,
				page,
				pageSize,
				filter
			);
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

	async getChartData(termIds: number[], filter?: RegistrationReportFilter) {
		return withAuth(async () => {
			const terms = await this.repository.getTermsByIds(termIds);
			if (!terms || terms.length === 0) {
				throw new Error('Terms not found');
			}

			const termNames = terms.map((t) => t.name);
			return await this.repository.getChartDataForMultipleTerms(
				termNames,
				filter
			);
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getAvailableSponsors() {
		return withAuth(async () => {
			return await this.repository.getAvailableSponsors();
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getAvailableCountries() {
		return withAuth(async () => {
			return await this.repository.getAvailableCountries();
		}, ['registry', 'admin', 'finance', 'academic']);
	}
}

export const registrationReportService = serviceWrapper(
	RegistrationReportService,
	'RegistrationReportService'
);
