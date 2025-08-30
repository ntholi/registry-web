'use server';

import { graduationRequests, paymentTypeEnum } from '@/db/schema';
import { graduationRequestsService as service } from './service';

type GraduationRequest = typeof graduationRequests.$inferInsert;

type PaymentReceiptData = {
  paymentType: (typeof paymentTypeEnum)[number];
  receiptNo: string;
};

type CreateGraduationRequestData = GraduationRequest & {
  paymentReceipts: PaymentReceiptData[];
};

export async function getGraduationRequest(id: number) {
  return service.get(id);
}

export async function getGraduationRequestByStudentNo(stdNo: number) {
  return service.getByStudentNo(stdNo);
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
