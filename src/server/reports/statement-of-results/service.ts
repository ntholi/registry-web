import { renderToBuffer } from '@react-pdf/renderer';
import { termsRepository } from '@/server/terms/repository';
import { statementOfResultsRepository } from './repository';
import MultipleStatementOfResultsPDF from './MultipleStatementOfResultsPDF';
import { getStudent } from '@/server/students/actions';

export default class StatementOfResultsService {
  private repository = statementOfResultsRepository;

  async generateStatementOfResultsReport(
    schoolId: number,
    programId: number,
    termName?: string,
  ): Promise<Buffer> {
    const currentTerm = termName || (await termsRepository.getActive())?.name;
    if (!currentTerm) {
      throw new Error('No active term found and no term specified');
    }

    await this.repository.validateFilters(schoolId, programId);

    const studentsData = await this.repository.getStudentsForStatementOfResults(
      programId,
      currentTerm,
    );
    if (studentsData.length === 0) {
      throw new Error(
        'No students found for the selected school, program, and term',
      );
    }

    // Transform the data to match the getStudent return type
    const students = await Promise.all(
      studentsData.map(async (studentData) => {
        const fullStudentData = await getStudent(studentData.stdNo);
        return fullStudentData;
      }),
    );

    // Filter out any null values
    const validStudents = students.filter((student) => student !== null);

    if (validStudents.length === 0) {
      throw new Error('No valid student data found');
    }

    const document = MultipleStatementOfResultsPDF({ students: validStudents });
    const buffer = await renderToBuffer(document);
    return Buffer.from(buffer);
  }
}

export const statementOfResultsService = new StatementOfResultsService();
