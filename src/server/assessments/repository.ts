import { db } from '@/db';
import { assessments, assessmentsAudit } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export default class AssessmentRepository extends BaseRepository<
  typeof assessments,
  'id'
> {
  constructor() {
    super(assessments, assessments.id);
  }

  async getByModuleId(moduleId: number) {
    return db.query.assessments.findMany({
      where: eq(assessments.moduleId, moduleId),
    });
  }

  override async create(data: typeof assessments.$inferInsert) {
    const session = await auth();

    const inserted = await db.transaction(async (tx) => {
      if (!session?.user?.id) throw new Error('Unauthorized');

      const [assessment] = await tx
        .insert(assessments)
        .values(data)
        .returning();
      await tx.insert(assessmentsAudit).values({
        assessmentId: assessment.id,
        action: 'create',
        previousAssessmentNumber: null,
        newAssessmentNumber: assessment.assessmentNumber,
        previousAssessmentType: null,
        newAssessmentType: assessment.assessmentType,
        previousTotalMarks: null,
        newTotalMarks: assessment.totalMarks,
        previousWeight: null,
        newWeight: assessment.weight,
        createdBy: session.user.id,
      });

      return assessment;
    });

    return inserted;
  }

  override async update(
    id: number,
    data: Partial<typeof assessments.$inferInsert>
  ) {
    const session = await auth();

    const updated = await db.transaction(async (tx) => {
      if (!session?.user?.id) throw new Error('Unauthorized');

      const current = await tx
        .select()
        .from(assessments)
        .where(eq(assessments.id, id))
        .limit(1)
        .then(([result]) => result);

      if (!current) throw new Error('Assessment not found');

      const [assessment] = await tx
        .update(assessments)
        .set(data)
        .where(eq(assessments.id, id))
        .returning();

      const hasChanges =
        (data.assessmentNumber !== undefined &&
          data.assessmentNumber !== current.assessmentNumber) ||
        (data.assessmentType !== undefined &&
          data.assessmentType !== current.assessmentType) ||
        (data.totalMarks !== undefined &&
          data.totalMarks !== current.totalMarks) ||
        (data.weight !== undefined && data.weight !== current.weight);

      if (hasChanges) {
        await tx.insert(assessmentsAudit).values({
          assessmentId: id,
          action: 'update',
          previousAssessmentNumber: current.assessmentNumber,
          newAssessmentNumber: assessment.assessmentNumber,
          previousAssessmentType: current.assessmentType,
          newAssessmentType: assessment.assessmentType,
          previousTotalMarks: current.totalMarks,
          newTotalMarks: assessment.totalMarks,
          previousWeight: current.weight,
          newWeight: assessment.weight,
          createdBy: session.user.id,
        });
      }

      return assessment;
    });

    return updated;
  }

  override async delete(id: number): Promise<void> {
    const session = await auth();

    await db.transaction(async (tx) => {
      if (!session?.user?.id) throw new Error('Unauthorized');

      const current = await tx
        .select()
        .from(assessments)
        .where(eq(assessments.id, id))
        .limit(1)
        .then(([result]) => result);

      if (!current) throw new Error('Assessment not found');

      await tx.insert(assessmentsAudit).values({
        assessmentId: id,
        action: 'delete',
        previousAssessmentNumber: current.assessmentNumber,
        newAssessmentNumber: null,
        previousAssessmentType: current.assessmentType,
        newAssessmentType: null,
        previousTotalMarks: current.totalMarks,
        newTotalMarks: null,
        previousWeight: current.weight,
        newWeight: null,
        createdBy: session.user.id,
      });

      await tx.delete(assessments).where(eq(assessments.id, id));
    });
  }

  async getAuditHistory(assessmentId: number) {
    return db.query.assessmentsAudit.findMany({
      where: eq(assessmentsAudit.assessmentId, assessmentId),
      with: {
        createdByUser: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: (audit, { desc }) => [desc(audit.date)],
    });
  }
}

export const assessmentsRepository = new AssessmentRepository();
