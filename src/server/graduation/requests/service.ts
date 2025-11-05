import type { graduationRequests, paymentType } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import type { QueryOptions } from '../../base/BaseRepository';
import { serviceWrapper } from '../../base/serviceWrapper';
import GraduationRequestRepository from './repository';

type GraduationRequest = typeof graduationRequests.$inferInsert;

type PaymentReceiptData = {
	paymentType: (typeof paymentType.enumValues)[number];
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

	async getClearanceData(graduationRequestId: number) {
		return withAuth(
			async () => this.repository.getClearanceData(graduationRequestId),
			['student', 'admin', 'registry'],
			async (session) => {
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

	async findByStatus(
		status: 'pending' | 'approved' | 'rejected',
		params: QueryOptions<typeof graduationRequests>
	) {
		return withAuth(
			async () => this.repository.findByStatus(status, params),
			['registry', 'admin']
		);
	}
}

export const graduationRequestsService = serviceWrapper(
	GraduationRequestService,
	'GraduationRequest'
);
