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
		termId: number,
		filter?: RegistrationReportFilter
	): Promise<Buffer> {
		return withAuth(async () => {
			const term = await this.repository.getTermById(termId);
			if (!term) {
				throw new Error('Term not found');
			}

			const reportData = await this.repository.getSummaryRegistrationData(
				term.name,
				filter
			);

			const document = createSummaryRegistrationDocument(reportData);
			const buffer = await Packer.toBuffer(document);
			return Buffer.from(buffer);
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async generateStudentsListReport(
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

	async getAvailableTerms() {
		return withAuth(async () => {
			return await this.repository.getAllActiveTerms();
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getRegistrationDataForTerm(
		termId: number,
		filter?: RegistrationReportFilter
	) {
		return withAuth(async () => {
			const term = await this.repository.getTermById(termId);
			if (!term) {
				throw new Error('Term not found');
			}

			const fullData = await this.repository.getFullRegistrationData(
				term.name,
				filter
			);
			const summaryData = await this.repository.getSummaryRegistrationData(
				term.name,
				filter
			);

			return {
				term,
				fullData: {
					termName: term.name,
					totalStudents: fullData.length,
					students: fullData,
					generatedAt: new Date(),
				},
				summaryData,
			};
		}, ['registry', 'admin', 'finance', 'academic']);
	}

	async getPaginatedRegistrationStudents(
		termId: number,
		page: number = 1,
		pageSize: number = 20,
		filter?: RegistrationReportFilter
	) {
		return withAuth(async () => {
			const term = await this.repository.getTermById(termId);
			if (!term) {
				throw new Error('Term not found');
			}

			return await this.repository.getPaginatedRegistrationData(
				term.name,
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

	async getChartData(termId: number, filter?: RegistrationReportFilter) {
		return withAuth(async () => {
			const term = await this.repository.getTermById(termId);
			if (!term) {
				throw new Error('Term not found');
			}

			return await this.repository.getChartData(term.name, filter);
		}, ['registry', 'admin', 'finance', 'academic']);
	}
}

export const registrationReportService = serviceWrapper(
	RegistrationReportService,
	'RegistrationReportService'
);
