import withAuth from '@/server/base/withAuth';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import { Packer } from 'docx';
import { createSummaryRegistrationDocument } from './document';
import { createFullRegistrationExcel } from './excel';
import {
  RegistrationReportRepository,
  RegistrationReportFilter,
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
      const fullReport = {
        termName: term.name,
        totalStudents: reportData.length,
        students: reportData,
        generatedAt: new Date(),
      };

      // Use Excel for full report instead of Word
      const buffer = await createFullRegistrationExcel(fullReport);
      return buffer;
    }, ['registry', 'admin']);
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
    }, ['registry', 'admin']);
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
      const fullReport = {
        termName: term.name,
        totalStudents: reportData.length,
        students: reportData,
        generatedAt: new Date(),
      };

      const buffer = await createFullRegistrationExcel(fullReport);
      return buffer;
    }, ['registry', 'admin']);
  }

  async getAvailableTerms() {
    return withAuth(async () => {
      return await this.repository.getAllActiveTerms();
    }, ['registry', 'admin']);
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
    }, ['registry', 'admin']);
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
    }, ['registry', 'admin']);
  }

  async getAvailableSchools() {
    return withAuth(async () => {
      return await this.repository.getAvailableSchools();
    }, ['registry', 'admin']);
  }

  async getAvailablePrograms(schoolId?: number) {
    return withAuth(async () => {
      return await this.repository.getAvailablePrograms(schoolId);
    }, ['registry', 'admin']);
  }
}

export const registrationReportService = serviceWrapper(
  RegistrationReportService,
  'RegistrationReportService'
);
