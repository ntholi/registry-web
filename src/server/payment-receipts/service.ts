import { paymentReceipts } from '@/db/schema';
import PaymentReceiptRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '../base/serviceWrapper';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

type PaymentReceipt = typeof paymentReceipts.$inferInsert;

class PaymentReceiptService {
  constructor(private readonly repository = new PaymentReceiptRepository()) {}

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['student']);
  }

  async getAll(params: QueryOptions<typeof paymentReceipts>) {
    return withAuth(async () => this.repository.query(params), ['student']);
  }

  async getByGraduationRequest(graduationRequestId: number) {
    return withAuth(async () => {
      return db.query.paymentReceipts.findMany({
        where: eq(paymentReceipts.graduationRequestId, graduationRequestId),
      });
    }, ['student']);
  }

  async create(data: PaymentReceipt) {
    return withAuth(async () => this.repository.create(data), ['student']);
  }

  async createMany(data: PaymentReceipt[]) {
    return withAuth(async () => {
      const results = [];
      for (const receipt of data) {
        results.push(await this.repository.create(receipt));
      }
      return results;
    }, ['student']);
  }

  async update(id: number, data: Partial<PaymentReceipt>) {
    return withAuth(async () => this.repository.update(id, data), ['student']);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), ['student']);
  }
}

export const paymentReceiptService = serviceWrapper(
  PaymentReceiptService,
  'PaymentReceipt'
);
