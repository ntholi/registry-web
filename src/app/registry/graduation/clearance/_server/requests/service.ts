import type { graduationRequests, ReceiptType } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
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
const adminOnly = async () => false;

class GraduationRequestService {
	constructor(
		private readonly repository = new GraduationRequestRepository()
	) {}

	async first() {
		return withPermission(async () => this.repository.findFirst(), adminOnly);
	}

	async get(id: number) {
		return withPermission(
			async () => this.repository.findById(id),
			async (session) =>
				session?.user?.role === 'registry' ||
				session?.user?.role === 'finance' ||
				session?.user?.role === 'student'
		);
	}

	async getByStudentNo(stdNo: number) {
		return withPermission(
			async () => this.repository.findByStudentNo(stdNo),
			async (session) =>
				session?.user?.role === 'student' || session?.user?.role === 'registry'
		);
	}

	async getByStudentProgramId(studentProgramId: number) {
		return withPermission(
			async () => this.repository.findByStudentProgramId(studentProgramId),
			async (session) =>
				session?.user?.role === 'student' ||
				session?.user?.role === 'admin' ||
				session?.user?.role === 'registry'
		);
	}

	async getEligiblePrograms(stdNo: number) {
		return withPermission(
			async () => this.repository.getEligiblePrograms(stdNo),
			async (session) => session?.user?.role === 'student'
		);
	}

	async selectStudentProgramForGraduation(stdNo: number) {
		return withPermission(
			async () => this.repository.selectStudentProgramForGraduation(stdNo),
			async (session) => session?.user?.role === 'student'
		);
	}

	async getAll(params: QueryOptions<typeof graduationRequests>) {
		return withPermission(async () => this.repository.query(params), adminOnly);
	}

	async findAll(params: QueryOptions<typeof graduationRequests>) {
		return withPermission(
			async () => this.repository.findAllPaginated(params),
			async (session) =>
				session?.user?.role === 'registry' || session?.user?.role === 'admin'
		);
	}

	async create(data: GraduationRequest) {
		return withPermission(
			async (session) =>
				this.repository.create(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'graduation_request_submitted',
				}),
			adminOnly
		);
	}

	async createWithPaymentReceipts(data: CreateGraduationRequestData) {
		return withPermission(
			async (session) => {
				const { paymentReceipts, stdNo, ...graduationRequestData } = data;

				return this.repository.createWithPaymentReceipts(
					{
						graduationRequestData,
						paymentReceipts,
						stdNo,
					},
					{
						userId: session!.user!.id!,
						role: session!.user!.role!,
						activityType: 'graduation_request_submitted',
					}
				);
			},
			async (session) =>
				session?.user?.role === 'student' ||
				session?.user?.role === 'registry' ||
				session?.user?.role === 'admin'
		);
	}

	async update(id: number, data: Partial<GraduationRequest>) {
		return withPermission(
			async (session) =>
				this.repository.update(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'graduation_request_updated',
				}),
			adminOnly
		);
	}

	async delete(id: number) {
		return withPermission(
			async (session) =>
				this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'graduation_request_updated',
				}),
			adminOnly
		);
	}

	async count() {
		return withPermission(async () => this.repository.count(), adminOnly);
	}

	async getClearanceData(graduationRequestId: number) {
		return withPermission(
			async () => this.repository.getClearanceData(graduationRequestId),
			async (session) => {
				if (
					session.user?.role === 'admin' ||
					session.user?.role === 'registry'
				) {
					return true;
				}
				const graduationRequest =
					await this.repository.findById(graduationRequestId);
				return graduationRequest?.studentProgram?.stdNo === session.user?.stdNo;
			}
		);
	}

	async countByStatus(status: 'pending' | 'approved' | 'rejected') {
		return withPermission(
			async () => this.repository.countByStatus(status),
			'dashboard'
		);
	}
}

export const graduationRequestsService = serviceWrapper(
	GraduationRequestService,
	'GraduationRequest'
);
