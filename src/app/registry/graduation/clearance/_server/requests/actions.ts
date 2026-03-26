'use server';

import type { graduationRequests, ReceiptType } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
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

export async function getGraduationRequest(id: number) {
	return service.get(id);
}

export async function getGraduationRequestByStudentNo(stdNo: number) {
	const result = await service.getByStudentNo(stdNo);
	return result.length > 0 ? result[0] : null;
}

export async function getEligiblePrograms(stdNo: number) {
	return service.getEligiblePrograms(stdNo);
}

export const createGraduationRequest = createAction(
	async (graduationRequest: GraduationRequest) => {
		return service.create(graduationRequest);
	}
);

export const createGraduationRequestWithPaymentReceipts = createAction(
	async (data: CreateGraduationRequestData) => {
		return service.createWithPaymentReceipts(data);
	}
);

export const updateGraduationRequest = createAction(
	async (id: number, graduationRequest: Partial<GraduationRequest>) => {
		return service.update(id, graduationRequest);
	}
);

export const deleteGraduationRequest = createAction(async (id: number) => {
	return service.delete(id);
});

export async function getGraduationClearanceData(graduationRequestId: number) {
	return service.getClearanceData(graduationRequestId);
}

export async function countByStatus(
	status: 'pending' | 'approved' | 'rejected'
) {
	return service.countByStatus(status);
}

export async function findAllGraduationRequests(
	page = 1,
	search = '',
	status?: 'pending' | 'approved' | 'rejected'
) {
	return service.findAll({
		page,
		search,
		status,
	});
}
