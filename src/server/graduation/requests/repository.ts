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

      // Create clearance requests for finance and library departments
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

      // Create clearance requests for finance and library departments
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
}

export const graduationRequestsRepository = new GraduationRequestRepository();
