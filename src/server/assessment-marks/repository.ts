import { db } from '@/db';
import {
  assessmentMarks,
  assessmentMarksAudit,
  assessments,
} from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

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

  async findByModuleAndStudent(moduleId: number, stdNo: number) {
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
      where: and(
        inArray(assessmentMarks.assessmentId, assessmentIds),
        eq(assessmentMarks.stdNo, stdNo),
      ),
    });
  }

  async getAssessmentsByModuleId(moduleId: number) {
    return db.query.assessments.findMany({
      where: eq(assessments.moduleId, moduleId),
    });
  }

  override async create(data: typeof assessmentMarks.$inferInsert) {
    const session = await auth();

    const inserted = await db.transaction(async (tx) => {
      if (!session?.user?.id) throw new Error('Unauthorized');

      const [mark] = await tx.insert(assessmentMarks).values(data).returning();
      await tx.insert(assessmentMarksAudit).values({
        assessmentMarkId: mark.id,
        action: 'create',
        previousMarks: null,
        newMarks: mark.marks,
        createdBy: session.user.id,
      });

      return mark;
    });

    return inserted;
  }
  override async update(
    id: number,
    data: Partial<typeof assessmentMarks.$inferInsert>,
  ) {
    const session = await auth();

    const updated = await db.transaction(async (tx) => {
      if (!session?.user?.id) throw new Error('Unauthorized');

      const current = await tx
        .select()
        .from(assessmentMarks)
        .where(eq(assessmentMarks.id, id))
        .limit(1)
        .then(([result]) => result);

      if (!current) throw new Error('Assessment mark not found');

      const [mark] = await tx
        .update(assessmentMarks)
        .set(data)
        .where(eq(assessmentMarks.id, id))
        .returning();

      if (data.marks !== undefined && data.marks !== current.marks) {
        await tx.insert(assessmentMarksAudit).values({
          assessmentMarkId: id,
          action: 'update',
          previousMarks: current.marks,
          newMarks: mark.marks,
          createdBy: session.user.id,
        });
      }

      return mark;
    });

    return updated;
  }

  override async delete(id: number): Promise<void> {
    const session = await auth();

    await db.transaction(async (tx) => {
      if (!session?.user?.id) throw new Error('Unauthorized');

      const current = await tx
        .select()
        .from(assessmentMarks)
        .where(eq(assessmentMarks.id, id))
        .limit(1)
        .then(([result]) => result);

      if (!current) throw new Error('Assessment mark not found');
      await tx.insert(assessmentMarksAudit).values({
        assessmentMarkId: id,
        action: 'delete',
        previousMarks: current.marks,
        newMarks: null,
        createdBy: session.user.id,
      });

      await tx.delete(assessmentMarks).where(eq(assessmentMarks.id, id));
    });
  }

  async getAuditHistory(assessmentMarkId: number) {
    return db.query.assessmentMarksAudit.findMany({
      where: eq(assessmentMarksAudit.assessmentMarkId, assessmentMarkId),
      with: {
        createdByUser: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: (audit, { desc }) => [desc(audit.date)],
    });
  }
}

export const assessmentMarksRepository = new AssessmentMarkRepository();
