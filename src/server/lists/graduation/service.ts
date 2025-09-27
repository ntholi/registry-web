import { graduationLists } from '@/db/schema';
import GraduationListRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../../base/BaseRepository';
import { serviceWrapper } from '../../base/serviceWrapper';
import { googleSheetsService, StudentData } from '@/lib/googleSheets';

type GraduationList = typeof graduationLists.$inferInsert;

class GraduationListService {
  constructor(private readonly repository = new GraduationListRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: string) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof graduationLists>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: GraduationList) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: string, data: Partial<GraduationList>) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: string) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }

  async getStudentsForGraduation() {
    return withAuth(
      async () => this.repository.getStudentsForGraduation(),
      ['admin', 'registry']
    );
  }

  async populateGraduationList(id: string) {
    return withAuth(async () => {
      // Get the graduation list
      const graduationList = await this.repository.findById(id);
      if (!graduationList) {
        throw new Error('Graduation list not found');
      }

      // Get students with cleared graduation requests
      const studentsData = await this.repository.getStudentsForGraduation();

      // Transform to StudentData format
      const students: StudentData[] = studentsData.map((student) => ({
        studentNo: student.studentNo.toString(),
        name: student.studentName,
        program: student.programName,
        school: student.schoolName,
        gown: student.graduationGownReceipt,
        fee: student.graduationFeeReceipt,
      }));

      let spreadsheetId = graduationList.spreadsheetId;
      let spreadsheetUrl = graduationList.spreadsheetUrl;

      try {
        if (!spreadsheetId) {
          // Create new Google Sheet
          const result = await googleSheetsService.createGraduationSheet(
            graduationList.name,
            students
          );
          spreadsheetId = result.spreadsheetId;
          spreadsheetUrl = result.spreadsheetUrl;
        } else {
          // Update existing Google Sheet
          await googleSheetsService.updateGraduationSheet(
            spreadsheetId,
            students
          );
        }

        // Update the graduation list record with success status
        const updatedList = await this.repository.update(id, {
          spreadsheetId,
          spreadsheetUrl,
          status: 'populated',
          populatedAt: new Date(),
        });

        return updatedList;
      } catch (error: any) {
        // If Google Sheets fails, still update the graduation list status but without sheet info
        console.error('Google Sheets integration failed:', error.message);

        const updatedList = await this.repository.update(id, {
          status: 'populated',
          populatedAt: new Date(),
        });

        // Re-throw the error with additional context
        throw new Error(
          `Graduation list populated but Google Sheets integration failed: ${error.message}`
        );
      }
    }, ['admin', 'registry']);
  }
}

export const graduationListsService = serviceWrapper(
  GraduationListService,
  'GraduationList'
);
