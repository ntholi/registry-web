'use server';

import type { graduationRequests, paymentType } from '@/core/db/schema';
import { graduationRequestsService as service } from './service';

type GraduationRequest = typeof graduationRequests.$inferInsert;

type PaymentReceiptData = {
	paymentType: (typeof paymentType.enumValues)[number];
	receiptNo: string;
};

type CreateGraduationRequestData = GraduationRequest & {
	paymentReceipts: PaymentReceiptData[];
};

export async function getGraduationRequest(id: number) {
	return service.get(id);
}

export async function getGraduationRequestByStudentNo(stdNo: number) {
	const result = await service.getByStudentNo(stdNo);
	return result.length > 0 ? result[0] : null;
}

export async function getGraduationRequestByStudentProgramId(
	studentProgramId: number
) {
	return service.getByStudentProgramId(studentProgramId);
}

export async function getEligiblePrograms(stdNo: number) {
	return service.getEligiblePrograms(stdNo);
}

export async function selectStudentProgramForGraduation(stdNo: number) {
	return service.selectStudentProgramForGraduation(stdNo);
}

export async function getGraduationRequests(page: number = 1, search = '') {
	return service.getAll({ page, search });
}

export async function createGraduationRequest(
	graduationRequest: GraduationRequest
) {
	return service.create(graduationRequest);
}

export async function createGraduationRequestWithPaymentReceipts(
	data: CreateGraduationRequestData
) {
	return service.createWithPaymentReceipts(data);
}

export async function updateGraduationRequest(
	id: number,
	graduationRequest: Partial<GraduationRequest>
) {
	return service.update(id, graduationRequest);
}

export async function deleteGraduationRequest(id: number) {
	return service.delete(id);
}

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
	return service.findByStatus(status ?? 'pending', {
		page,
		search,
	});
}
