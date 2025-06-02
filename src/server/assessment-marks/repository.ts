import BaseRepository from '@/server/base/BaseRepository';
import { assessmentMarks, assessments, assessmentGrades, gradeEnum } from '@/db/schema';
import { db } from '@/db';
import { eq, inArray, and } from 'drizzle-orm';

export default class AssessmentMarkRepository extends BaseRepository<
  typeof assessmentMarks,
  'id'
> {
  constructor() {
    super(assessmentMarks, 'id');
  }

  async findByModuleId(moduleId: number) {
    const moduleAssessments = await db.query.assessments.findMany({
      where: eq(assessments.moduleId, moduleId),
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

  async findGradeByAssessmentAndStudent(assessmentId: number, stdNo: number) {
    return db.query.assessmentGrades.findFirst({
      where: and(
        eq(assessmentGrades.assessmentId, assessmentId),
        eq(assessmentGrades.stdNo, stdNo)
      ),
    });
  }

  async saveGrade(assessmentId: number, stdNo: number, grade: typeof gradeEnum[number]) {
    const existingGrade = await this.findGradeByAssessmentAndStudent(assessmentId, stdNo);

    if (existingGrade) {
      return db
        .update(assessmentGrades)
        .set({ grade })
        .where(
          and(
            eq(assessmentGrades.assessmentId, assessmentId),
            eq(assessmentGrades.stdNo, stdNo)
          )
        )
        .returning();
    } else {
      return db
        .insert(assessmentGrades)
        .values({
          assessmentId,
          stdNo,
          grade,
        })
        .returning();
    }
  }

  async findGradesByModuleId(moduleId: number) {
    const moduleAssessments = await db.query.assessments.findMany({
      where: eq(assessments.moduleId, moduleId),
      columns: {
        id: true,
      },
    });

    const assessmentIds = moduleAssessments.map((assessment) => assessment.id);

    if (assessmentIds.length === 0) {
      return [];
    }

    return db.query.assessmentGrades.findMany({
      where: inArray(assessmentGrades.assessmentId, assessmentIds),
    });
  }
}

export const assessmentMarksRepository = new AssessmentMarkRepository();
