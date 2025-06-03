import { assessmentMarks, gradeEnum } from '@/db/schema';
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

  async getGradeByAssessmentAndStudent(assessmentId: number, stdNo: number) {
    return withAuth(
      async () =>
        this.repository.findGradeByAssessmentAndStudent(assessmentId, stdNo),
      ['academic'],
    );
  }

  async saveGrade(
    assessmentId: number,
    stdNo: number,
    grade: (typeof gradeEnum)[number],
  ) {
    return withAuth(
      async () => this.repository.saveGrade(assessmentId, stdNo, grade),
      ['academic'],
    );
  }

  async getGradesByModuleId(moduleId: number) {
    return withAuth(
      async () => this.repository.findGradesByModuleId(moduleId),
      ['academic'],
    );
  }
}

export const assessmentMarksService = new AssessmentMarkService();
