'use server';

import type { ApplicationStatus, applications } from '@/core/database';
import type { ApplicationFilters } from '../_lib/types';
import { applicationsService } from './service';

type Application = typeof applications.$inferInsert;

export async function getApplication(id: number) {
	return applicationsService.get(id);
}

export async function findAllApplications(
	page = 1,
	search = '',
	filters?: ApplicationFilters
) {
	return applicationsService.search(page, search, filters);
}

export async function createApplication(data: Application) {
	return applicationsService.create(data);
}

export async function updateApplication(id: number, data: Application) {
	return applicationsService.update(id, data);
}

export async function deleteApplication(id: number) {
	return applicationsService.delete(id);
}

export async function changeApplicationStatus(
	applicationId: number,
	newStatus: ApplicationStatus,
	notes?: string,
	rejectionReason?: string
) {
	return applicationsService.changeStatus(
		applicationId,
		newStatus,
		notes,
		rejectionReason
	);
}

export async function addApplicationNote(
	applicationId: number,
	content: string
) {
	return applicationsService.addNote(applicationId, content);
}

export async function getApplicationNotes(applicationId: number) {
	return applicationsService.getNotes(applicationId);
}

export async function recordApplicationPayment(
	applicationId: number,
	receiptId: string
) {
	return applicationsService.recordPayment(applicationId, receiptId);
}

export async function getApplicationPaymentInfo(applicationId: number) {
	return applicationsService.getPaymentInfo(applicationId);
}

export async function findApplicationsByApplicant(applicantId: string) {
	return applicationsService.findByApplicant(applicantId);
}

export async function countApplicationsByStatus(status: ApplicationStatus) {
	return applicationsService.countByStatus(status);
}

export async function countPendingApplications() {
	return applicationsService.countPending();
}
