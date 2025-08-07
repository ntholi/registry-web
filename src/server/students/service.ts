import { students } from '@/db/schema';
import StudentRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import { getCurrentTerm } from '../terms/actions';
import { StudentFilter } from './actions';

type Student = typeof students.$inferInsert;

class StudentService {
  private repository: StudentRepository;

  constructor() {
    this.repository = new StudentRepository();
  }

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(stdNo: number) {
    return withAuth(async () => {
      return this.repository.findById(stdNo);
    }, ['dashboard']);
  }

  async getAcademicHistory(stdNo: number) {
    return withAuth(async () => {
      return this.repository.findAcademicHistory(stdNo);
    }, ['academic', 'registry', 'finance', 'student']);
  }

  async getRegistrationData(stdNo: number) {
    return withAuth(async () => {
      return this.repository.findRegistrationData(stdNo);
    }, ['academic', 'registry', 'finance']);
  }

  async findStudentByUserId(userId: string) {
    return withAuth(
      async () => this.repository.findStudentByUserId(userId),
      ['auth']
    );
  }

  async findByModuleId(moduleId: number) {
    const term = await getCurrentTerm();
    return withAuth(
      async () => this.repository.findByModuleId(moduleId, term.name),
      ['dashboard']
    );
  }

  async findAll(
    params: QueryOptions<typeof students> & { filter?: StudentFilter }
  ) {
    return withAuth(
      async () => this.repository.queryBasic(params),
      ['dashboard'],
      async (session) => {
        if (
          session.user?.role &&
          ['admin', 'registry', 'finance', 'library'].includes(
            session.user.role
          )
        ) {
          return true;
        }

        if (session.user?.position) {
          return ['admin', 'manager', 'program_leader', 'year_leader'].includes(
            session.user.position
          );
        }
        return false;
      }
    );
  }

  async create(data: Student) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(stdNo: number, data: Student) {
    return withAuth(async () => this.repository.update(stdNo, data), []);
  }

  async delete(stdNo: number) {
    return withAuth(async () => this.repository.delete(stdNo), []);
  }

  async updateUserId(stdNo: number, userId: string | null) {
    return withAuth(
      async () => this.repository.updateUserId(stdNo, userId),
      ['admin', 'registry']
    );
  }

  async updateProgramStructure(stdNo: number, structureId: number) {
    return withAuth(
      async () => this.repository.updateProgramStructure(stdNo, structureId),
      ['admin', 'registry']
    );
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const studentsService = serviceWrapper(
  StudentService,
  'StudentsService'
);
