import BaseRepository from '@/server/base/BaseRepository';
import {
  graduationRequests,
  clearance,
  graduationClearance,
  paymentReceipts,
  paymentTypeEnum,
} from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
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
        await this.processAcademicClearance(tx, request.id, data.stdNo);
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
        student: true,
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
    return db.query.graduationRequests.findFirst({
      where: eq(graduationRequests.stdNo, stdNo),
      with: {
        student: true,
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
          graduationRequestData.stdNo
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
    stdNo: number
  ) {
    const programs = await studentsService.getStudentPrograms(stdNo);
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
