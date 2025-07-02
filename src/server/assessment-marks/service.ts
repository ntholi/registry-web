import { assessmentMarks } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import AssessmentMarkRepository from './repository';

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

  async getByModuleId(moduleId: number) {
    return withAuth(
      async () => this.repository.findByModuleId(moduleId),
      ['academic'],
    );
  }

  async getByModuleAndStudent(moduleId: number, stdNo: number) {
    return withAuth(
      async () => this.repository.findByModuleAndStudent(moduleId, stdNo),
      ['academic'],
    );
  }

  async getAssessmentsByModuleId(moduleId: number) {
    return withAuth(
      async () => this.repository.getAssessmentsByModuleId(moduleId),
      ['academic'],
    );
  }

  async getAuditHistory(assessmentMarkId: number) {
    return withAuth(
      async () => this.repository.getAuditHistory(assessmentMarkId),
      ['academic'],
    );
  }
  async createOrUpdateMarks(data: AssessmentMark) {
    return withAuth(
      async () => this.repository.createOrUpdateMarks(data),
      ['academic'],
    );
  }

  async createOrUpdateMarksInBulk(dataArray: AssessmentMark[]) {
    return withAuth(
      async () => this.repository.createOrUpdateMarksInBulk(dataArray),
      ['academic'],
    );
  }

  async getStudentAuditHistory(stdNo: number) {
    return withAuth(
      async () => this.repository.getStudentAuditHistory(stdNo),
      ['academic'],
    );
  }
}

export const assessmentMarksService = new AssessmentMarkService();
