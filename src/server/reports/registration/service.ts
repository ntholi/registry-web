import { Packer } from 'docx';
import { RegistrationReportRepository } from './repository';
import {
  createFullRegistrationDocument,
  createSummaryRegistrationDocument,
} from './document';
import withAuth from '@/server/base/withAuth';
import { serviceWrapper } from '@/server/base/serviceWrapper';

export class RegistrationReportService {
  private repository = new RegistrationReportRepository();

  async generateFullRegistrationReport(termId: number): Promise<Buffer> {
    return withAuth(async () => {
      const term = await this.repository.getTermById(termId);
      if (!term) {
        throw new Error('Term not found');
      }

      const reportData = await this.repository.getFullRegistrationData(
        term.name
      );
      const fullReport = {
        termName: term.name,
        totalStudents: reportData.length,
        students: reportData,
        generatedAt: new Date(),
      };

      const document = createFullRegistrationDocument(fullReport);
      const buffer = await Packer.toBuffer(document);
      return Buffer.from(buffer);
    }, ['registry', 'admin']);
  }

  async generateSummaryRegistrationReport(termId: number): Promise<Buffer> {
    return withAuth(async () => {
      const term = await this.repository.getTermById(termId);
      if (!term) {
        throw new Error('Term not found');
      }

      const reportData = await this.repository.getSummaryRegistrationData(
        term.name
      );

      const document = createSummaryRegistrationDocument(reportData);
      const buffer = await Packer.toBuffer(document);
      return Buffer.from(buffer);
    }, ['registry', 'admin']);
  }

  async getAvailableTerms() {
    return withAuth(async () => {
      return await this.repository.getAllActiveTerms();
    }, ['registry', 'admin']);
  }

  async getRegistrationDataForTerm(termId: number) {
    return withAuth(async () => {
      const term = await this.repository.getTermById(termId);
      if (!term) {
        throw new Error('Term not found');
      }

      const fullData = await this.repository.getFullRegistrationData(term.name);
      const summaryData = await this.repository.getSummaryRegistrationData(
        term.name
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
}

export const registrationReportService = new RegistrationReportService();
