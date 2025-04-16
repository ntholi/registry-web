import BaseRepository from '@/server/base/BaseRepository';
import { assessments } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

export default class AssessmentRepository extends BaseRepository<
  typeof assessments,
  'id'
> {
  constructor() {
    super(assessments, 'id');
  }

  async getBySemesterModuleId(semesterModuleId: number) {
    return db.query.assessments.findMany({
      where: eq(assessments.moduleId, semesterModuleId),
    });
  }
}

export const assessmentsRepository = new AssessmentRepository();
