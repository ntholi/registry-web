import { assessmentMarks } from '@/db/schema';
import AssessmentMarkRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';

type AssessmentMark = typeof assessmentMarks.$inferInsert;

class AssessmentMarkService {
  constructor(private readonly repository = new AssessmentMarkRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['academic']);
  }

  async getAll(params: QueryOptions<typeof assessmentMarks>) {
    return withAuth(async () => this.repository.query(params), ['academic']);
  }

  async create(data: AssessmentMark) {
    return withAuth(async () => this.repository.create(data), ['academic']);
  }

  async update(id: number, data: AssessmentMark) {
    return withAuth(async () => this.repository.update(id, data), ['academic']);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), ['academic']);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }

  async getByModuleId(semesterModuleId: number) {
    return withAuth(
      async () => this.repository.findByModuleId(semesterModuleId),
      ['academic'],
    );
  }

  async getByModuleIds(semesterModuleIds: number[]) {
    return withAuth(
      async () => this.repository.findByModuleIds(semesterModuleIds),
      ['academic'],
    );
  }
}

export const assessmentMarksService = new AssessmentMarkService();
