import type { graduationRequests, ReceiptType } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import GraduationRequestRepository from './repository';

type GraduationRequest = typeof graduationRequests.$inferInsert;

type PaymentReceiptData = {
	receiptType: ReceiptType;
	receiptNo: string;
};

type CreateGraduationRequestData = GraduationRequest & {
	paymentReceipts: PaymentReceiptData[];
	stdNo: number;
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
			['registry', 'finance', 'student']
		);
	}

	async getByStudentNo(stdNo: number) {
		return withAuth(
			async () => this.repository.findByStudentNo(stdNo),
			['student', 'registry']
		);
	}

	async getByStudentProgramId(studentProgramId: number) {
		return withAuth(
			async () => this.repository.findByStudentProgramId(studentProgramId),
			['student', 'admin', 'registry']
		);
	}

	async getEligiblePrograms(stdNo: number) {
		return withAuth(
			async () => this.repository.getEligiblePrograms(stdNo),
			['student']
		);
	}

	async selectStudentProgramForGraduation(stdNo: number) {
		return withAuth(
			async () => this.repository.selectStudentProgramForGraduation(stdNo),
			['student']
		);
	}

	async getAll(params: QueryOptions<typeof graduationRequests>) {
		return withAuth(async () => this.repository.query(params), []);
	}

	async findAll(params: QueryOptions<typeof graduationRequests>) {
		return withAuth(
			async () => this.repository.findAllPaginated(params),
			['registry', 'admin']
		);
	}

	async create(data: GraduationRequest) {
		return withAuth(async () => this.repository.create(data), []);
	}

	async createWithPaymentReceipts(data: CreateGraduationRequestData) {
		return withAuth(async () => {
			const { paymentReceipts, stdNo, ...graduationRequestData } = data;

			return this.repository.createWithPaymentReceipts({
				graduationRequestData,
				paymentReceipts,
				stdNo,
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

	async getClearanceData(graduationRequestId: number) {
		return withAuth(
			async () => this.repository.getClearanceData(graduationRequestId),
			async (session) => {
				if (['admin', 'registry'].includes(session.user?.role as string)) {
					return true;
				}
				const graduationRequest =
					await this.repository.findById(graduationRequestId);
				return graduationRequest?.studentProgram?.stdNo === session.user?.stdNo;
			}
		);
	}

	async countByStatus(status: 'pending' | 'approved' | 'rejected') {
		return withAuth(
			async () => this.repository.countByStatus(status),
			['dashboard']
		);
	}
}

export const graduationRequestsService = serviceWrapper(
	GraduationRequestService,
	'GraduationRequest'
);
