import withAuth from '@/server/base/withAuth';
import { serviceWrapper } from '../../base/serviceWrapper';
import BulkRepository from './repository';
import { studentsService } from '../../students/service';

class BulkService {
  private repository: BulkRepository;

  constructor() {
    this.repository = new BulkRepository();
  }

  async getDistinctGraduationDates() {
    return withAuth(async () => {
      return await this.repository.findDistinctGraduationDates();
    }, ['admin', 'registry']);
  }

  async getStudentsByGraduationDate(graduationDate: string) {
    return withAuth(async () => {
      const stdNos =
        await this.repository.findStudentsByGraduationDate(graduationDate);

      const students = await Promise.all(
        stdNos.map(async (stdNo) => {
          try {
            return await studentsService.getAcademicHistory(stdNo, true);
          } catch {
            return null;
          }
        })
      );

      return students.filter((student): student is NonNullable<typeof student> => student !== null);
    }, ['admin', 'registry']);
  }
}

export const bulkService = serviceWrapper(BulkService, 'BulkService');
