import BaseRepository from '@/server/base/BaseRepository';
import { assessmentMarks, assessments } from '@/db/schema';
import { db } from '@/db';
import { eq, inArray } from 'drizzle-orm';

export default class AssessmentMarkRepository extends BaseRepository<
  typeof assessmentMarks,
  'id'
> {
  constructor() {
    super(assessmentMarks, 'id');
  }

  async findByModuleId(semesterModuleId: number) {
    const moduleAssessments = await db.query.assessments.findMany({
      where: eq(assessments.semesterModuleId, semesterModuleId),
      columns: {
        id: true,
      },
    });

    const assessmentIds = moduleAssessments.map((assessment) => assessment.id);

    if (assessmentIds.length === 0) {
      return [];
    }

    return db.query.assessmentMarks.findMany({
      where: inArray(assessmentMarks.assessmentId, assessmentIds),
      with: {
        assessment: true,
      },
    });
  }
}

export const assessmentMarksRepository = new AssessmentMarkRepository();
