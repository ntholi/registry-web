import { Packer } from 'docx';
import { termsRepository } from '@/server/terms/repository';
import { courseSummaryRepository, CourseSummaryReport } from './repository';
import { createCourseSummaryDocument } from './document';

export default class CourseSummaryService {
  private repository = courseSummaryRepository;
  async generateCourseSummaryReport(
    programId: number | undefined,
    semesterModuleId: number,
  ): Promise<Buffer> {
    const currentTerm = await termsRepository.getActive();
    if (!currentTerm) {
      throw new Error('No active term found');
    }

    const reportData = await this.repository.getCourseSummaryData(
      semesterModuleId,
      currentTerm.name,
      programId,
    );

    if (!reportData) {
      throw new Error('Course data not found');
    }

    const document = createCourseSummaryDocument(reportData);
    const buffer = await Packer.toBuffer(document);
    return Buffer.from(buffer);
  }

  async getAvailableModulesForProgram(programId: number) {
    const currentTerm = await termsRepository.getActive();
    if (!currentTerm) {
      throw new Error('No active term found');
    }

    return this.repository.getAvailableModulesForProgram(
      programId,
      currentTerm.name,
    );
  }
}

export const courseSummaryService = new CourseSummaryService();
