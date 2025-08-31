import { graduationRequests, paymentTypeEnum } from '@/db/schema';
import GraduationRequestRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../../base/BaseRepository';
import { serviceWrapper } from '../../base/serviceWrapper';

type GraduationRequest = typeof graduationRequests.$inferInsert;

type PaymentReceiptData = {
  paymentType: (typeof paymentTypeEnum)[number];
  receiptNo: string;
};

type CreateGraduationRequestData = GraduationRequest & {
  paymentReceipts: PaymentReceiptData[];
};

class GraduationRequestService {
  constructor(
    private readonly repository = new GraduationRequestRepository()
  ) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(
      async () => this.repository.findById(id),
      ['admin', 'registry', 'student'],
      async (session) => {
        const graduationRequest = await this.repository.findById(id);
        return graduationRequest?.stdNo === session.user?.stdNo;
      }
    );
  }

  async getByStudentNo(stdNo: number) {
    return withAuth(
      async () => this.repository.findByStudentNo(stdNo),
      ['student']
    );
  }

  async getAll(params: QueryOptions<typeof graduationRequests>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: GraduationRequest) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async createWithPaymentReceipts(data: CreateGraduationRequestData) {
    return withAuth(async () => {
      const { paymentReceipts, ...graduationRequestData } = data;

      return this.repository.createWithPaymentReceipts({
        graduationRequestData,
        paymentReceipts,
      });
    }, ['student']);
  }

  async update(id: number, data: Partial<GraduationRequest>) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const graduationRequestsService = serviceWrapper(
  GraduationRequestService,
  'GraduationRequest'
);
