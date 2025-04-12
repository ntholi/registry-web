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
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof assessmentMarks>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: AssessmentMark) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: AssessmentMark) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const assessmentMarksService = new AssessmentMarkService();
