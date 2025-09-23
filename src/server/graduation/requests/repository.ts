import BaseRepository from '@/server/base/BaseRepository';
import {
  graduationRequests,
  clearance,
  graduationClearance,
  paymentReceipts,
  paymentTypeEnum,
  studentPrograms,
  studentSemesters,
  students,
} from '@/db/schema';
import { db } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { studentsService } from '@/server/students/service';
import { getOutstandingFromStructure } from '@/utils/grades';

export default class GraduationRequestRepository extends BaseRepository<
  typeof graduationRequests,
  'id'
> {
  constructor() {
    super(graduationRequests, 'id');
  }

  override async create(data: typeof graduationRequests.$inferInsert) {
    return db.transaction(async (tx) => {
      const [request] = await tx
        .insert(graduationRequests)
        .values(data)
        .returning();

      for (const department of ['finance', 'library']) {
        const [clearanceRecord] = await tx
          .insert(clearance)
          .values({
            department: department as 'finance' | 'library',
            status: 'pending',
          })
          .returning();

        await tx.insert(graduationClearance).values({
          graduationRequestId: request.id,
          clearanceId: clearanceRecord.id,
        });
      }

      try {
        await this.processAcademicClearance(
          tx,
          request.id,
          data.studentProgramId
        );
      } catch (error) {
        console.error('Error processing academic clearance:', error);
        const [academicClearanceRecord] = await tx
          .insert(clearance)
          .values({
            department: 'academic',
            status: 'pending',
            message:
              'Error processing academic clearance automatically. Manual review required.',
          })
          .returning();

        await tx.insert(graduationClearance).values({
          graduationRequestId: request.id,
          clearanceId: academicClearanceRecord.id,
        });
      }

      return request;
    });
  }

  override async findById(id: number) {
    return db.query.graduationRequests.findFirst({
      where: eq(graduationRequests.id, id),
      with: {
        studentProgram: {
          with: {
            student: true,
            structure: {
              with: {
                program: true,
              },
            },
          },
        },
        paymentReceipts: true,
        graduationClearances: {
          with: {
            clearance: {
              with: {
                respondedBy: true,
              },
            },
          },
        },
      },
    });
  }

  async findByStudentProgramId(studentProgramId: number) {
    return db.query.graduationRequests.findFirst({
      where: eq(graduationRequests.studentProgramId, studentProgramId),
      with: {
        studentProgram: {
          with: {
            student: true,
            structure: {
              with: {
                program: true,
              },
            },
          },
        },
        paymentReceipts: true,
        graduationClearances: {
          with: {
            clearance: {
              with: {
                respondedBy: true,
              },
            },
          },
        },
      },
    });
  }

  async findByStudentNo(stdNo: number) {
    // Find the graduation request by looking up the student program
    const studentProgramId =
      await this.selectStudentProgramForGraduation(stdNo);
    if (!studentProgramId) {
      return null;
    }
    return this.findByStudentProgramId(studentProgramId);
  }

  async selectStudentProgramForGraduation(
    stdNo: number
  ): Promise<number | null> {
    // First priority: Completed programs with specific terms
    const completedProgram = await db.query.studentPrograms.findFirst({
      where: and(
        eq(studentPrograms.stdNo, stdNo),
        eq(studentPrograms.status, 'Completed')
      ),
      with: {
        semesters: true,
      },
    });

    if (completedProgram) {
      // Check if any semester has the required terms
      const hasRequiredTerms = completedProgram.semesters.some((semester) =>
        ['2025-02', '2024-07', '2024-02'].includes(semester.term)
      );

      if (hasRequiredTerms) {
        return completedProgram.id;
      }
    }

    // Second priority: Active programs
    const activeProgram = await db.query.studentPrograms.findFirst({
      where: and(
        eq(studentPrograms.stdNo, stdNo),
        eq(studentPrograms.status, 'Active')
      ),
    });

    if (activeProgram) {
      return activeProgram.id;
    }

    // Final fallback: Any program (prioritize Completed, then Active)
    const fallbackProgram = await db.query.studentPrograms.findFirst({
      where: eq(studentPrograms.stdNo, stdNo),
      orderBy: (studentPrograms, { desc, sql }) => [
        sql`CASE ${studentPrograms.status} WHEN 'Completed' THEN 1 WHEN 'Active' THEN 2 ELSE 3 END`,
        studentPrograms.id,
      ],
    });

    return fallbackProgram?.id || null;
  }

  async getEligiblePrograms(stdNo: number) {
    return db.query.studentPrograms.findMany({
      where: and(
        eq(studentPrograms.stdNo, stdNo),
        sql`${studentPrograms.status} IN ('Active', 'Completed')`
      ),
      with: {
        structure: {
          with: {
            program: {
              with: {
                school: true,
              },
            },
          },
        },
        semesters: true,
      },
      orderBy: (studentPrograms, { desc, sql }) => [
        sql`CASE ${studentPrograms.status} WHEN 'Completed' THEN 1 WHEN 'Active' THEN 2 ELSE 3 END`,
        studentPrograms.id,
      ],
    });
  }

  async createWithPaymentReceipts(data: {
    graduationRequestData: typeof graduationRequests.$inferInsert;
    paymentReceipts: Array<{
      paymentType: (typeof paymentTypeEnum)[number];
      receiptNo: string;
    }>;
  }) {
    return db.transaction(async (tx) => {
      const { graduationRequestData, paymentReceipts: receipts } = data;

      const [graduationRequest] = await tx
        .insert(graduationRequests)
        .values(graduationRequestData)
        .returning();

      for (const department of ['finance', 'library']) {
        const [clearanceRecord] = await tx
          .insert(clearance)
          .values({
            department: department as 'finance' | 'library',
            status: 'pending',
          })
          .returning();

        await tx.insert(graduationClearance).values({
          graduationRequestId: graduationRequest.id,
          clearanceId: clearanceRecord.id,
        });
      }

      try {
        await this.processAcademicClearance(
          tx,
          graduationRequest.id,
          graduationRequestData.studentProgramId
        );
      } catch (error) {
        console.error('Error processing academic clearance:', error);
        const [academicClearanceRecord] = await tx
          .insert(clearance)
          .values({
            department: 'academic',
            status: 'pending',
            message:
              'Error processing academic clearance automatically. Manual review required.',
          })
          .returning();

        await tx.insert(graduationClearance).values({
          graduationRequestId: graduationRequest.id,
          clearanceId: academicClearanceRecord.id,
        });
      }

      if (receipts.length > 0) {
        const receiptValues = receipts.map((receipt) => ({
          ...receipt,
          graduationRequestId: graduationRequest.id,
        }));

        await tx.insert(paymentReceipts).values(receiptValues);
      }

      return graduationRequest;
    });
  }

  private async processAcademicClearance(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    graduationRequestId: number,
    studentProgramId: number
  ) {
    // Get the student program with student info
    const studentProgram = await tx.query.studentPrograms.findFirst({
      where: eq(studentPrograms.id, studentProgramId),
      with: {
        student: true,
      },
    });

    if (!studentProgram) {
      throw new Error('Student program not found');
    }

    const programs = await studentsService.getStudentPrograms(
      studentProgram.stdNo
    );
    if (!programs || programs.length === 0) {
      throw new Error('Student not found');
    }

    const outstanding = await getOutstandingFromStructure(programs);

    let status: 'approved' | 'rejected' | 'pending';
    let message: string | undefined;

    if (
      outstanding.failedNeverRepeated.length === 0 &&
      outstanding.neverAttempted.length === 0
    ) {
      status = 'approved';
    } else {
      status = 'pending';
      const reasons = [];

      if (outstanding.failedNeverRepeated.length > 0) {
        const failedList = outstanding.failedNeverRepeated
          .map((m) => `${m.code} - ${m.name}`)
          .join(', ');
        reasons.push(`Failed modules never repeated: ${failedList}`);
      }

      if (outstanding.neverAttempted.length > 0) {
        const neverAttemptedList = outstanding.neverAttempted
          .map((m) => `${m.code} - ${m.name}`)
          .join(', ');
        reasons.push(`Required modules never attempted: ${neverAttemptedList}`);
      }

      message = `Academic requirements not met. ${reasons.join('; ')}. Please ensure all program modules are completed successfully before applying for graduation.`;
    }

    const [academicClearanceRecord] = await tx
      .insert(clearance)
      .values({
        department: 'academic',
        status,
        message,
      })
      .returning();

    await tx.insert(graduationClearance).values({
      graduationRequestId,
      clearanceId: academicClearanceRecord.id,
    });
  }
}

export const graduationRequestsRepository = new GraduationRequestRepository();
