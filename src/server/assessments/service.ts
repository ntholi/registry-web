import { assessments } from '@/db/schema';
import AssessmentRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import { getCurrentTerm } from '../terms/actions';

type Assessment = typeof assessments.$inferInsert;

class AssessmentService {
  constructor(private readonly repository = new AssessmentRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['academic']);
  }

  async getAll(params: QueryOptions<typeof assessments>) {
    return withAuth(async () => this.repository.query(params), ['academic']);
  }

  async getBySemesterModuleId(semesterModuleId: number) {
    return withAuth(
      async () => this.repository.getBySemesterModuleId(semesterModuleId),
      ['academic'],
    );
  }

  async create(data: Assessment) {
    return withAuth(async () => this.repository.create(data), ['academic']);
  }

  async update(id: number, data: Assessment) {
    return withAuth(async () => this.repository.update(id, data), ['academic']);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), ['academic']);
  }

  async count() {
    return withAuth(async () => this.repository.count(), ['academic']);
  }
}

export const assessmentsService = serviceWrapper(
  AssessmentService,
  'AssessmentsService',
);
