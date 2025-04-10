import { assessments } from '@/db/schema';
import AssessmentRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';

type Assessment = typeof assessments.$inferInsert;

class AssessmentService {
  constructor(private readonly repository = new AssessmentRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof assessments>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: Assessment) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: Assessment) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const assessmentsService = new AssessmentService();
