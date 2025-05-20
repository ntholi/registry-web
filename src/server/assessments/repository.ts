import BaseRepository from '@/server/base/BaseRepository';
import { assessments } from '@/db/schema';
import { db } from '@/db';
import { eq, inArray } from 'drizzle-orm';

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

  async getBySemesterModuleIds(semesterModuleIds: number[]) {
    if (!semesterModuleIds.length) return [];
    
    return db.query.assessments.findMany({
      where: inArray(assessments.moduleId, semesterModuleIds),
    });
  }
}

export const assessmentsRepository = new AssessmentRepository();
