'use server';

import type { graduationRequests, ReceiptType } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { graduationRequestsService as service } from './service';

type GraduationRequest = typeof graduationRequests.$inferInsert;

type PaymentReceiptData = {
	receiptType: ReceiptType;
	receiptNo: string;
};

type CreateGraduationRequestData = GraduationRequest & {
	paymentReceipts: PaymentReceiptData[];
	stdNo: number;
};

export const getGraduationRequest = createAction(async (id: number) =>
	service.get(id)
);

export const getGraduationRequestByStudentNo = createAction(
	async (stdNo: number) => {
		const result = await service.getByStudentNo(stdNo);
		return result.length > 0 ? result[0] : null;
	}
);

export const getEligiblePrograms = createAction(async (stdNo: number) =>
	service.getEligiblePrograms(stdNo)
);

export const createGraduationRequest = createAction(
	async (graduationRequest: GraduationRequest) =>
		service.create(graduationRequest)
);

export const createGraduationRequestWithPaymentReceipts = createAction(
	async (data: CreateGraduationRequestData) =>
		service.createWithPaymentReceipts(data)
);

export const updateGraduationRequest = createAction(
	async (id: number, graduationRequest: Partial<GraduationRequest>) =>
		service.update(id, graduationRequest)
);

export const deleteGraduationRequest = createAction(async (id: number) =>
	service.delete(id)
);

export const getGraduationClearanceData = createAction(
	async (graduationRequestId: number) =>
		service.getClearanceData(graduationRequestId)
);

export const countByStatus = createAction(
	async (status: 'pending' | 'approved' | 'rejected') =>
		service.countByStatus(status)
);

export const findAllGraduationRequests = createAction(
	async (page: number = 1, search: string = '') =>
		service.findAll({
			page,
			search,
		})
);
